require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
})

module.exports = {
  siteMetadata: {
    siteUrl: "https://gatsbykontent-aihomepage.gatsbyjs.io/",
    title: "Gatsby Kontent.ai Homepage Starter",
    author: `Gatsby`,
    description: "A Gatsby Starter for building homepages with Kontent.ai",
  },
  plugins: [
    {
      resolve: `@kontent-ai/gatsby-source`,
      options: {
        projectId: process.env.KONTENT_PROJECT_ID,
        languageCodenames: [`en-US`],
        usePreviewUrl: !!(
          process.env.KONTENT_PREVIEW_ENABLED &&
          process.env.KONTENT_PREVIEW_ENABLED.toLowerCase() === 'true'
        ),
        authorizationKey:
          process.env.KONTENT_PREVIEW_ENABLED &&
          process.env.KONTENT_PREVIEW_ENABLED.toLowerCase() === 'true'
            ? process.env.KONTENT_PREVIEW_KEY
            : undefined,
      },
    },
    "gatsby-plugin-sharp",
    "gatsby-plugin-image",
    "gatsby-transformer-sharp",
    "gatsby-plugin-vanilla-extract",
    {
      resolve: "gatsby-plugin-manifest",
      options: {
        name: "Gatsby Starter Kontent.ai Homepage",
        short_name: "Gatsby",
        start_url: "/",
        background_color: "#41D9C5",
        theme_color: "#231F20",
        icon: "src/favicon.png",
      },
    },
    "gatsby-plugin-netlify",
  ],
}
