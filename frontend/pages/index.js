import React from 'react'
import Head from 'next/head'
import PropTypes from 'prop-types'
import { Header, Image } from 'semantic-ui-react'
import { withTranslation } from '../i18n'
import Carousel from '../components/Carousel'
import carouselImagesData from '../assets/data/carousel'
import logo from '../assets/images/logo.svg'

const Homepage = ({ images, t }) => (
  <div className='homepage'>
    <Head>
      <title>{t('homepage.page_title')}</title>
    </Head>

    <Image src={logo} alt='' className='logo' />
    <Header as='h1'>{t('homepage.title')}</Header>
    <Header as='h2'>
      {t('homepage.subtitle1')}<br />
      {t('homepage.subtitle2')}
    </Header>
    <Carousel images={images} />
    <script type='application/ld+json'>
      {JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        url: 'https://lionskins.co/',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://lionskins.co/counter-strike-global-offensive/#search={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      })}
    </script>
  </div>
)

Homepage.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  t: PropTypes.func.isRequired
}

const shuffle = array => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

export const getServerSideProps = async () => {
  const images = shuffle(Object.keys(carouselImagesData)).slice(0, 10)
  return { props: { images } }
}

export default withTranslation('homepage')(Homepage)
