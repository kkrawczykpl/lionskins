import React from 'react'
import PropTypes from 'prop-types'
import { Card, Label } from 'semantic-ui-react'
import Image from '../Image'
import TrackedLink from '../TrackedLink'
import { Link, withTranslation } from '../../i18n'
import { Providers } from '../../utils/enums'
import { Qualities, Weapons } from '../../utils/csgo/enums'
import { getColorFromRarity, getIconFromProvider, getSkinInternalUrl, getSkinUrlFromProvider } from '../../utils/csgo/utils'
import useSettings from '../SettingsProvider'

const Skin = ({ skin, t }) => {
  const internalUrl = getSkinInternalUrl(skin)
  const skinName = skin.slug === 'vanilla' ? t('csgo.qualities.vanilla') : skin.name
  const alt = `${skin.weapon.name} - ${skinName}`
  const { currency } = useSettings()

  return (
    <Card color={getColorFromRarity(skin.rarity)} className='skin item'>
      <Link href={internalUrl}>
        <a>
          <Image
            alt={alt}
            imageSrc={skin.imageUrl}
            loaderSrc={`/images/csgo/weapons/default_skin_${skin.weapon.name}.png`}
            className='ui image'
          />
        </a>
      </Link>
      {skin.statTrak && (
        <Label className='stattrak' color='orange'>{t('csgo.skin.stat_trak')}</Label>
      )}
      {skin.souvenir && (
        <Label className='souvenir' color='yellow'>{t('csgo.skin.souvenir')}</Label>
      )}
      <Card.Content>
        <Card.Header>
          <Link href={internalUrl}><a>{t(Weapons[skin.weapon.name])} - {skinName}</a></Link>
        </Card.Header>
        <Card.Meta>
          {t(Qualities[skin.quality])}
        </Card.Meta>
      </Card.Content>
      <Card.Content extra>
        <div className='prices'>
          {Object.keys(Providers).sort().map(provider => {
            if (!skin.prices[provider]) {
              return null
            }
            return (
              <div className='price' key={provider}>
                <TrackedLink href={getSkinUrlFromProvider(skin, provider)}>
                  {getIconFromProvider(provider)}
                  {t(`common:currency.${currency}`, { price: skin.prices[provider] })}
                </TrackedLink>
              </div>
            )
          })}
        </div>
      </Card.Content>
    </Card>
  )
}

Skin.propTypes = {
  t: PropTypes.func.isRequired,
  skin: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    quality: PropTypes.string,
    rarity: PropTypes.string,
    statTrak: PropTypes.bool.isRequired,
    souvenir: PropTypes.bool.isRequired,
    weapon: PropTypes.shape({
      name: PropTypes.string.isRequired
    }),
    prices: PropTypes.shape({
      bitskins: PropTypes.number,
      csmoney: PropTypes.number,
      skinbaron: PropTypes.number,
      skinport: PropTypes.number,
      steam: PropTypes.number
    })
  })
}

export default withTranslation(['csgo', 'common'])(Skin)
