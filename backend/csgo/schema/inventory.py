from collections import defaultdict
from datetime import timedelta
from decimal import Decimal

import graphene
from django.db.models import F, Min, Sum
from django.utils import timezone
from graphene_django.filter.fields import DjangoFilterConnectionField

from csgo.models.skin import Skin
from csgo.providers.steam import client as steam_client
from csgo.schema.skin import SkinNode
from lionskins.models.enums import Currencies
from lionskins.schema.types import TypeCurrency
from lionskins.utils.currency_converter import CurrencyConverter
from users.models import Inventory, SkinInventory, User


class Query(graphene.ObjectType):
    inventory = DjangoFilterConnectionField(SkinNode, pro_player_id=graphene.ID())
    inventory_cost = graphene.Decimal(
        pro_player_id=graphene.ID(), currency=TypeCurrency()
    )

    def resolve_inventory(self, info, **args):
        queryset = Skin.objects.all()
        pro_player_id = args.get("pro_player_id")
        inventory = get_user_inventory(info.context, pro_player_id)
        if inventory is None:
            return queryset.none()

        return SkinNode.get_queryset(
            queryset.filter(skininventory__inventory=inventory), info
        )

    def resolve_inventory_cost(self, info, **args) -> Decimal | None:
        pro_player_id = args.get("pro_player_id")
        inventory = get_user_inventory(info.context, pro_player_id)
        if inventory is None:
            return None

        total_cost = (
            SkinInventory.objects.filter(inventory=inventory)
            .annotate(price=Min("skin__prices__price") * F("quantity"))
            .aggregate(cost=Sum("price"))["cost"]
        )
        return CurrencyConverter.convert(
            total_cost, Currencies.usd, args.get("currency")
        )


def get_user_inventory(request, pro_player_id: str | None) -> Inventory | None:
    if pro_player_id:
        try:
            user = User.objects.get(proplayer__id=pro_player_id)
        except User.DoesNotExist:
            return None
    elif request.user.is_anonymous:
        return None
    else:
        user = request.user

    inventory, created = Inventory.objects.get_or_create(user=user)
    if should_refresh_inventory(inventory, bool(pro_player_id), created):
        if not refresh_inventory(user, inventory):
            return None
    return inventory


def should_refresh_inventory(
    inventory: Inventory, is_pro_player: bool, is_newly_created: bool
) -> bool:
    if is_newly_created:
        return True

    if is_pro_player:
        return inventory.update_date < timezone.now() - timedelta(hours=1)
    if inventory.in_error:
        return inventory.update_date < timezone.now() - timedelta(minutes=1)
    return inventory.update_date < timezone.now() - timedelta(minutes=10)


def refresh_inventory(user: User, inventory: Inventory) -> bool:
    raw_inventory, ok = steam_client.get_inventory(steam_id=user.steam_id)
    inventory.update_date = timezone.now()
    inventory.in_error = not ok
    inventory.save()

    if ok:
        market_hash_names = {item["market_hash_name"] for item in raw_inventory}
        skins = Skin.objects.filter(market_hash_name__in=market_hash_names).values_list(
            "pk", "market_hash_name"
        )

        skin_id_by_market_hash_name = {
            market_hash_name: skin_id for skin_id, market_hash_name in skins
        }
        counter_by_skin_id = defaultdict(int)
        for item in raw_inventory:
            if item["market_hash_name"] in skin_id_by_market_hash_name:
                counter_by_skin_id[
                    skin_id_by_market_hash_name[item["market_hash_name"]]
                ] += 1

        SkinInventory.objects.filter(inventory=inventory).delete()
        SkinInventory.objects.bulk_create(
            SkinInventory(inventory=inventory, skin_id=skin_id, quantity=quantity)
            for skin_id, quantity in counter_by_skin_id.items()
        )

    return ok
