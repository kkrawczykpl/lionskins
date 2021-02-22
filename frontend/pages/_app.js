import React, { useContext } from 'react'
import { ApolloProvider } from '@apollo/client'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { I18nContext } from 'next-i18next'
import PropTypes from 'prop-types'
import { client } from '../apollo'
import { appWithTranslation, useTranslation } from '../i18n'
import { AuthenticationProvider } from '../components/AuthenticationProvider'
import { SettingsProvider } from '../components/SettingsProvider'
import Footer from '../components/Footer'
import Header from '../components/Header'
import Matomo from '../components/Matomo'

import 'semantic-ui-css/semantic.min.css'
import 'swiper/swiper.scss'
import '../assets/css/index.scss'

const MyApp = ({ Component, pageProps }) => {
  const { i18n } = useContext(I18nContext)
  const [t] = useTranslation()
  const router = useRouter()
  const languages = [i18n.options.defaultLanguage, ...i18n.options.otherLanguages]
  const path = router.asPath.split('?')[0].slice(4)
  return (
    <ApolloProvider client={client}>
      <AuthenticationProvider>
        <SettingsProvider>
          <Head>
            {languages.map(language => (
              <link
                key={`alternate-${language}`} rel='alternate' hrefLang={language}
                href={`${process.env.NEXT_PUBLIC_FRONTEND_DOMAIN}/${language}/${path}`}
              />
            ))}
            <meta key='description' name='description' content={t('head.description')} />
          </Head>
          <Header />
          <main>
            <Component {...pageProps} />
          </main>
          <Footer />
          <Matomo />
        </SettingsProvider>
      </AuthenticationProvider>
    </ApolloProvider>
  )
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.object
}

export default appWithTranslation(MyApp)
