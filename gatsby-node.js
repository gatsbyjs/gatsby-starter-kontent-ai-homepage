const { getGatsbyImageResolver } = require("gatsby-plugin-image/graphql-utils")
const { getKontentItemNodeTypeName } = require("@kontent-ai/gatsby-source")
const { getGatsbyImageData } = require("@kontent-ai/gatsby-components")
const { createContentDigest } = require("gatsby-core-utils")
const { v4: uuidv4 } = require("uuid")

exports.createSchemaCustomization = async ({ actions }) => {
  actions.createFieldExtension({
    name: "KontentNodeFromElement",
    args: {
      variableName: {
        type: "String",
        defaultValue: "",
      },
      type: {
        type: "String",
        defaultValue: "",
      },
    },
    extend(options, prevFieldConfig) {
      return {
        async resolve(source, args, context, info) {
          const codenames = source.elements[options.variableName].value
          const lng = source.preferred_language

          const entry = await context.nodeModel.findOne({
            query: {
              filter: {
                system: {
                  codename: {
                    in: codenames,
                  },
                },
                preferred_language: {
                  eq: lng,
                },
              },
            },
            type: getKontentItemNodeTypeName(options.type),
          })

          return entry
        },
      }
    },
  })

  actions.createFieldExtension({
    name: "KontentSocialService",
    args: {
      variableName: {
        type: "String",
        defaultValue: "",
      },
    },
    extend(options, prevFieldConfig) {
      return {
        async resolve(source, args, context, info) {
          return source.elements[options.variableName].value[0].name
        },
      }
    },
  })

  actions.createFieldExtension({
    name: "KontentNodesFromElement",
    args: {
      variableName: {
        type: "String",
        defaultValue: "",
      },
      type: {
        type: "String",
        defaultValue: "",
      },
    },
    extend(options, prevFieldConfig) {
      return {
        async resolve(source, args, context, info) {
          const codenames = source.elements[options.variableName].value
          const lng = source.preferred_language

          const { entries } = await context.nodeModel.findAll({
            query: {
              filter: {
                system: {
                  codename: {
                    in: codenames,
                  },
                },
                preferred_language: {
                  eq: lng,
                },
              },
            },
            type: getKontentItemNodeTypeName(options.type),
          })
          const arrayEntries = Array.from(entries)

          return codenames.map(
            (val) => arrayEntries.filter((x) => x.system.codename === val)[0]
          )
        },
      }
    },
  })

  actions.createFieldExtension({
    name: "KontentImage",
    args: {
      variableName: {
        type: "String",
        defaultValue: "image",
      },
    },
    extend(options, prevFieldConfig) {
      return {
        async resolve(source, args, context, info) {
          const image = source.elements[options.variableName].value

          if (image.length === 0) {
            return null
          }

          const gatsbyImage = getGatsbyImageData({ image: image[0] })

          return {
            id: uuidv4(),
            url: image.url,
            gatsbyImageData: gatsbyImage,
            alt: "alt",
            internal: {
              type: "kontent_asset_homepage_image",
              contentDigest: createContentDigest(image),
              owner: "kontent",
            },
            parent: null,
            children: [],
          }
        },
      }
    },
  })

  actions.createFieldExtension({
    name: "blocktype",
    extend(options) {
      return {
        resolve(source) {
          const type = source.internal.type.replace("kontent_item_", "")
          const blocktype_parts = type.split("_")
          return blocktype_parts
            .map((value) => value.charAt(0).toUpperCase() + value.slice(1))
            .join("")
        },
      }
    },
  })

  actions.createFieldExtension({
    name: "imagePassthroughArgs",
    extend(options) {
      const { args } = getGatsbyImageResolver()
      return {
        args,
      }
    },
  })

  actions.createFieldExtension({
    name: "navItemType",
    args: {
      name: {
        type: "String!",
        defaultValue: "Link",
      },
    },
    extend(options) {
      return {
        resolve() {
          switch (options.name) {
            case "Group":
              return "Group"
            default:
              return "Link"
          }
        },
      }
    },
  })

  // abstract interfaces
  actions.createTypes(/* GraphQL */ `
    interface HomepageBlock implements Node {
      id: ID!
      blocktype: String
    }

    interface HomepageLink implements Node {
      id: ID!
      href: String
      text: String
    }

    interface HeaderNavItem implements Node {
      id: ID!
      navItemType: String
    }

    interface NavItem implements Node & HeaderNavItem {
      id: ID!
      navItemType: String
      href: String
      text: String
      icon: HomepageImage
      description: String
    }

    interface NavItemGroup implements Node & HeaderNavItem {
      id: ID!
      navItemType: String
      name: String
      navItems: [NavItem]
    }

    interface HomepageImage implements Node {
      id: ID!
      alt: String
      gatsbyImageData: JSON @imagePassthroughArgs
      url: String
    }

    interface HomepageHero implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      heading: String!
      kicker: String
      subhead: String
      image: HomepageImage
      text: String
      links: [HomepageLink]
    }

    interface HomepageFeature implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      heading: String
      kicker: String
      text: String
      image: HomepageImage
      links: [HomepageLink]
    }

    interface HomepageFeatureList implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      kicker: String
      heading: String
      text: String
      content: [HomepageFeature]
    }

    interface HomepageCta implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      kicker: String
      heading: String
      text: String
      image: HomepageImage
      links: [HomepageLink]
    }

    interface HomepageLogo implements Node {
      id: ID!
      image: HomepageImage
      alt: String
    }

    interface HomepageLogoList implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      text: String
      logos: [HomepageLogo]
    }

    interface HomepageTestimonial implements Node {
      id: ID!
      quote: String
      source: String
      avatar: HomepageImage
    }

    interface HomepageTestimonialList implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      kicker: String
      heading: String
      content: [HomepageTestimonial]
    }

    interface HomepageBenefit implements Node {
      id: ID!
      heading: String
      text: String
      image: HomepageImage
    }

    interface HomepageBenefitList implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      heading: String
      text: String
      content: [HomepageBenefit]
    }

    interface HomepageStat implements Node {
      id: ID!
      value: String
      label: String
      heading: String
    }

    interface HomepageStatList implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      kicker: String
      heading: String
      text: String
      image: HomepageImage
      icon: HomepageImage
      content: [HomepageStat]
      links: [HomepageLink]
    }

    interface HomepageProduct implements Node {
      id: ID!
      heading: String
      text: String
      image: HomepageImage
      links: [HomepageLink]
    }

    interface HomepageProductList implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      heading: String
      kicker: String
      text: String
      content: [HomepageProduct]
    }

    interface Homepage implements Node {
      id: ID!
      title: String
      description: String
      image: HomepageImage
      content: [HomepageBlock]
    }

    interface LayoutHeader implements Node {
      id: ID!
      navItems: [HeaderNavItem]
      cta: HomepageLink
    }

    enum SocialService {
      TWITTER
      FACEBOOK
      INSTAGRAM
      YOUTUBE
      LINKEDIN
      GITHUB
      DISCORD
      TWITCH
    }

    interface SocialLink implements Node {
      id: ID!
      username: String!
      service: SocialService!
    }

    interface LayoutFooter implements Node {
      id: ID!
      links: [HomepageLink]
      meta: [HomepageLink]
      socialLinks: [SocialLink]
      copyright: String
    }

    interface Layout implements Node {
      id: ID!
      header: LayoutHeader
      footer: LayoutFooter
    }

    interface AboutPage implements Node {
      id: ID!
      title: String
      description: String
      image: HomepageImage
      content: [HomepageBlock]
    }

    interface AboutHero implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      heading: String
      text: String
      image: HomepageImage
    }

    interface AboutStat implements Node {
      id: ID!
      value: String
      label: String
    }

    interface AboutStatList implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      content: [AboutStat]
    }

    interface AboutProfile implements Node {
      id: ID!
      image: HomepageImage
      name: String
      jobTitle: String
    }

    interface AboutLeadership implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      kicker: String
      heading: String
      subhead: String
      content: [AboutProfile]
    }

    interface AboutLogoList implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      heading: String
      links: [HomepageLink]
      logos: [HomepageLogo]
    }

    interface Page implements Node {
      id: ID!
      slug: String!
      title: String
      description: String
      image: HomepageImage
      html: String!
    }
  `)

  actions.createTypes(/* GraphQl */ `
    interface kontent_item_homepage_block implements Node & HomepageBlock {
      id: ID!
      blocktype: String
      system: kontent_item_system!
      preferred_language: String!
    }

    type kontent_asset_homepage_image implements Node & HomepageImage {
      id: ID!
      alt: String
      gatsbyImageData: JSON @imagePassthroughArgs
      url: String
    }

    interface kontent_item_header_nav_item implements Node & HeaderNavItem {
      id: ID!
      navItemType: String
      system: kontent_item_system!
      preferred_language: String!
    }
  `)

  actions.createTypes(/* GraphQL */ `
    type kontent_item_homepage_link implements Node & HomepageLink @dontInfer {
      id: ID!
      href: String @proxy(from: "elements.href.value")
      text: String @proxy(from: "elements.text.value")
    }

    type kontent_item_nav_item implements Node & NavItem & HeaderNavItem & kontent_item_header_nav_item
      @dontInfer {
      id: ID!
      navItemType: String @navItemType(name: "Link")
      href: String @proxy(from: "elements.href.value")
      text: String @proxy(from: "elements.text.value")
      icon: HomepageImage @KontentImage(variableName: "icon")
      description: String @proxy(from: "elements.description.value")
    }

    type kontent_item_navitemgroup implements Node & NavItemGroup & HeaderNavItem & kontent_item_header_nav_item
      @dontInfer {
      id: ID!
      navItemType: String @navItemType(name: "Group")
      name: String @proxy(from: "elements.name.value")
      navItems: [NavItem]
        @KontentNodesFromElement(variableName: "navitems", type: "nav_item")
    }

    type kontent_asset_homepage_image implements Node & HomepageImage {
      id: ID!
      alt: String
      gatsbyImageData: JSON @imagePassthroughArgs
      url: String
    }

    type kontent_item_homepage_hero implements Node & HomepageHero & kontent_item_homepage_block & HomepageBlock
      @dontInfer {
      id: ID!
      blocktype: String @blocktype
      heading: String! @proxy(from: "elements.heading.value")
      kicker: String @proxy(from: "elements.kicker.value")
      subhead: String @proxy(from: "elements.subhead.value")
      image: HomepageImage @KontentImage
      text: String @proxy(from: "elements.text.value")
      links: [HomepageLink]
        @KontentNodesFromElement(variableName: "links", type: "homepage_link")
    }

    type kontent_item_homepage_feature implements Node & kontent_item_homepage_block & HomepageBlock & HomepageFeature
      @dontInfer {
      blocktype: String @blocktype
      heading: String @proxy(from: "elements.heading.value")
      kicker: String @proxy(from: "elements.kicker.value")
      text: String @proxy(from: "elements.text.value")
      image: HomepageImage @KontentImage
      links: [HomepageLink]
        @KontentNodesFromElement(variableName: "links", type: "homepage_link")
    }

    type kontent_item_homepage_feature_list implements Node & kontent_item_homepage_block & HomepageBlock & HomepageFeatureList
      @dontInfer {
      blocktype: String @blocktype
      kicker: String @proxy(from: "elements.kicker.value")
      heading: String @proxy(from: "elements.heading.value")
      text: String @proxy(from: "elements.text.value")
      content: [HomepageFeature]
        @KontentNodesFromElement(
          variableName: "content"
          type: "homepage_feature"
        )
    }

    type kontent_item_homepage_cta implements Node & kontent_item_homepage_block & HomepageBlock & HomepageCta
      @dontInfer {
      blocktype: String @blocktype
      kicker: String @proxy(from: "elements.kicker.value")
      heading: String @proxy(from: "elements.heading.value")
      text: String @proxy(from: "elements.text.value")
      image: HomepageImage @KontentImage
      links: [HomepageLink]
        @KontentNodesFromElement(variableName: "links", type: "homepage_link")
    }

    type kontent_item_homepage_logo implements Node & HomepageLogo @dontInfer {
      id: ID!
      image: HomepageImage @KontentImage
      alt: String @proxy(from: "elements.alt.value")
    }

    type kontent_item_homepage_logo_list implements Node & kontent_item_homepage_block & HomepageBlock & HomepageLogoList
      @dontInfer {
      blocktype: String @blocktype
      text: String @proxy(from: "elements.text.value")
      logos: [HomepageLogo]
        @KontentNodesFromElement(variableName: "logos", type: "homepage_logo")
    }

    type kontent_item_homepage_testimonial implements Node & HomepageTestimonial
      @dontInfer {
      id: ID!
      quote: String @proxy(from: "elements.quote.value")
      source: String @proxy(from: "elements.source.value")
      avatar: HomepageImage @KontentImage(variableName: "avatar")
    }

    type kontent_item_homepage_testimonial_list implements Node & kontent_item_homepage_block & HomepageBlock & HomepageTestimonialList
      @dontInfer {
      id: ID!
      blocktype: String @blocktype
      kicker: String @proxy(from: "elements.kicker.value")
      heading: String @proxy(from: "elements.heading.value")
      content: [HomepageTestimonial]
        @KontentNodesFromElement(
          variableName: "content"
          type: "homepage_testimonial"
        )
    }

    type kontent_item_homepage_benefit implements Node & HomepageBenefit
      @dontInfer {
      id: ID!
      heading: String @proxy(from: "elements.heading.value")
      text: String @proxy(from: "elements.text.value")
      image: HomepageImage @KontentImage
    }

    type kontent_item_homepage_benefit_list implements Node & kontent_item_homepage_block & HomepageBlock & HomepageBenefitList
      @dontInfer {
      id: ID!
      blocktype: String @blocktype
      heading: String @proxy(from: "elements.heading.value")
      text: String @proxy(from: "elements.text.value")
      content: [HomepageBenefit]
        @KontentNodesFromElement(
          variableName: "content"
          type: "homepage_benefit"
        )
    }

    type kontent_item_homepage_stat implements Node & HomepageStat @dontInfer {
      id: ID!
      value: String @proxy(from: "elements.value.value")
      label: String @proxy(from: "elements.label.value")
      heading: String @proxy(from: "elements.heading.value")
    }

    type kontent_item_homepage_stat_list implements Node & kontent_item_homepage_block & HomepageBlock & HomepageStatList
      @dontInfer {
      id: ID!
      blocktype: String @blocktype
      kicker: String @proxy(from: "elements.kicker.value")
      heading: String @proxy(from: "elements.heading.value")
      text: String @proxy(from: "elements.text.value")
      image: HomepageImage @KontentImage
      icon: HomepageImage @KontentImage(variableName: "icon")
      content: [HomepageStat]
        @KontentNodesFromElement(variableName: "content", type: "homepage_stat")
      links: [HomepageLink]
        @KontentNodesFromElement(variableName: "links", type: "homepage_link")
    }

    type kontent_item_homepage_product implements Node & HomepageProduct
      @dontInfer {
      heading: String @proxy(from: "elements.heading.value")
      text: String @proxy(from: "elements.text.value")
      image: HomepageImage @KontentImage
      links: [HomepageLink]
        @KontentNodesFromElement(variableName: "links", type: "homepage_link")
    }

    type kontent_item_homepage_product_list implements Node & HomepageProductList & kontent_item_homepage_block & HomepageBlock
      @dontInfer {
      blocktype: String @blocktype
      heading: String @proxy(from: "elements.heading.value")
      kicker: String @proxy(from: "elements.kicker.value")
      text: String @proxy(from: "elements.text.value")
      content: [HomepageProduct]
        @KontentNodesFromElement(
          variableName: "content"
          type: "homepage_product"
        )
    }

    type kontent_item_homepage implements Node & Homepage @dontInfer {
      id: ID!
      title: String @proxy(from: "elements.title.value")
      description: String @proxy(from: "elements.description.value")
      image: HomepageImage @KontentImage
      content: [HomepageBlock]
        @KontentNodesFromElement(
          variableName: "content"
          type: "homepage_block"
        )
    }
  `)

  // CMS specific types for About page
  actions.createTypes(/* GraphQL */ `
    type kontent_item_about_hero implements Node & AboutHero & kontent_item_homepage_block & HomepageBlock
      @dontInfer {
      id: ID!
      blocktype: String @blocktype
      heading: String @proxy(from: "elements.heading.value")
      text: String @proxy(from: "elements.text.value")
      image: HomepageImage @KontentImage
    }

    type kontent_item_about_stat implements Node & AboutStat @dontInfer {
      id: ID!
      value: String @proxy(from: "elements.value.value")
      label: String @proxy(from: "elements.label.value")
    }

    type kontent_item_about_stat_list implements Node & AboutStatList & kontent_item_homepage_block & HomepageBlock
      @dontInfer {
      id: ID!
      blocktype: String @blocktype
      content: [AboutStat]
        @KontentNodesFromElement(variableName: "content", type: "about_stat")
    }

    type kontent_item_about_profile implements Node & AboutProfile @dontInfer {
      id: ID!
      image: HomepageImage @KontentImage
      name: String @proxy(from: "elements.name.value")
      jobTitle: String @proxy(from: "elements.job_title.value")
    }

    type kontent_item_about_leadership implements Node & AboutLeadership & kontent_item_homepage_block & HomepageBlock
      @dontInfer {
      id: ID!
      blocktype: String @blocktype
      kicker: String @proxy(from: "elements.kicker.value")
      heading: String @proxy(from: "elements.heading.value")
      subhead: String @proxy(from: "elements.subhead.value")
      content: [AboutProfile]
        @KontentNodesFromElement(variableName: "content", type: "about_profile")
    }

    type kontent_item_about_logo_list implements Node & AboutLogoList & kontent_item_homepage_block & HomepageBlock
      @dontInfer {
      id: ID!
      blocktype: String @blocktype
      heading: String @proxy(from: "elements.heading.value")
      links: [HomepageLink]
        @KontentNodesFromElement(variableName: "links", type: "homepage_link")
      logos: [HomepageLogo]
        @KontentNodesFromElement(variableName: "logos", type: "homepage_logo")
    }

    type kontent_item_about_page implements Node & AboutPage @dontInfer {
      id: ID!
      title: String @proxy(from: "elements.title.value")
      description: String @proxy(from: "elements.description.value")
      image: HomepageImage @KontentImage
      content: [HomepageBlock]
        @KontentNodesFromElement(
          variableName: "content"
          type: "homepage_block"
        )
    }
  `)

  // Layout types
  actions.createTypes(/* GraphQL */ `
    type kontent_item_layoutheader implements Node & LayoutHeader @dontInfer {
      id: ID!
      navItems: [HeaderNavItem]
        @KontentNodesFromElement(
          variableName: "navitems"
          type: "header_nav_item"
        )
      cta: HomepageLink
        @KontentNodeFromElement(variableName: "cta", type: "homepage_link")
    }

    type kontent_item_sociallink implements Node & SocialLink @dontInfer {
      id: ID!
      username: String! @proxy(from: "elements.username.value")
      service: SocialService! @KontentSocialService(variableName: "service")
    }

    type kontent_item_layoutfooter implements Node & LayoutFooter @dontInfer {
      id: ID!
      links: [HomepageLink]
        @KontentNodesFromElement(variableName: "links", type: "homepage_link")
      meta: [HomepageLink]
        @KontentNodesFromElement(variableName: "meta", type: "homepage_link")
      socialLinks: [SocialLink]
        @KontentNodesFromElement(
          variableName: "social_links"
          type: "sociallink"
        )
      copyright: String @proxy(from: "elements.copyright.value")
    }

    type kontent_item_layout implements Node & Layout @dontInfer {
      id: ID!
      header: LayoutHeader
        @KontentNodeFromElement(variableName: "header", type: "layoutheader")
      footer: LayoutFooter
        @KontentNodeFromElement(variableName: "footer", type: "layoutfooter")
    }
  `)

  // Page types
  actions.createTypes(/* GraphQL */ `
    type kontent_item_page implements Node & Page {
      id: ID!
      slug: String! @proxy(from: "elements.slug.value")
      title: String @proxy(from: "elements.title.value")
      description: String @proxy(from: "elements.description.value")
      image: HomepageImage @KontentImage
      html: String! @proxy(from: "elements.body.value")
    }
  `)
}

exports.createPages = ({ actions }) => {
  const { createSlice } = actions
  createSlice({
    id: "header",
    component: require.resolve("./src/components/header.js"),
  })
  createSlice({
    id: "footer",
    component: require.resolve("./src/components/footer.js"),
  })
}
      