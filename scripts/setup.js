const chalk = require("chalk")
const argv = require("yargs-parser")(process.argv.slice(2))
const fs = require("fs")
const path = require("path")
const inquirer = require("inquirer")
const {
  ImportService,
  ZipService,
  CleanService,
} = require("@kontent-ai/backup-manager")
const { FileService } = require("@kontent-ai/backup-manager/dist/cjs/lib/node")
const { cwd, chdir } = require("process")

const clearProject = async (projectId, managementApiKey) => {
  const cleanService = new CleanService({
    onDelete: (item) => {
      console.log(`Deleted: ${item.title} | ${item.type}`)
    },
    fixLanguages: true,
    projectId: projectId,
    apiKey: managementApiKey,
    enableLog: true,
  })

  await cleanService.cleanAllAsync()
}

const importData = async (projectId, managementApiKey) => {
  const fileService = new FileService({
    enableLog: true,
  })

  const current_directory = cwd()

  try {
    chdir(__dirname)

    const zipFile = await fileService.loadFileAsync("data")
    const zipService = new ZipService({
      context: "node.js",
      enableLog: true,
    })

    const importService = new ImportService({
      onImport: (item) => {
        console.log(`Imported: ${item.title} | ${item.type}`)
      },
      canImport: {
        asset: (item) => true,
        contentType: (item) => true,
        assetFolder: (item) => true,
        contentItem: (item) => true,
        contentTypeSnippet: (item) => true,
        language: (item) => true,
        languageVariant: (item) => true,
        taxonomy: (item) => true,
      },
      preserveWorkflow: true,
      projectId: projectId,
      apiKey: managementApiKey,
      enableLog: true,
      fixLanguages: true,
    })

    const importData = await zipService.extractZipAsync(zipFile)

    await importService.importFromSourceAsync(importData)
  } catch (exception) {
    console.log(`An error occurred: ${exception}`)
  } finally {
    chdir(current_directory)
  }
}

console.log(`
  To use this starter, please create a new project in app.kontent.ai
  and provide us with credentials need to set it up. If you want to use
  already existing project, keep in mind that it should be clean to avoid
  problems during importing data. This script provides you with an option to
  clear it for you. The required keys can be found in Project settings -> Api keys and
  you will need:

    1. ${chalk.blue("Project ID")}
    2. ${chalk.blue(
      "API Management key"
    )} needed for importing the content into the project

  Everything ready? Let's do it!
`)

const questions = [
  {
    name: "projectId",
    message: "Project ID",
    when: !argv.projectId && !process.env.KONTENT_PROJECT_ID,
  },
  {
    name: "managementApiKey",
    when: !argv.managementApiKey,
    message: "Your Content Management API access token",
  },
  {
    name: "cleanProject",
    when: !argv.cleanProject,
    message: `For best results, this script should be ran against an empty Kontent.ai project. Do you want to clear the project before proceeding? (y/n)`,
  },
]

inquirer
  .prompt(questions)
  .then(async ({ projectId, managementApiKey, cleanProject }) => {
    if (cleanProject === "y") {
      console.log(`Cleaning the project with projectID: ${projectId}`)
      await clearProject(projectId, managementApiKey)
      console.log("Cleaning completed")
    }
    return { projectId, managementApiKey }
  })
  .then(({ projectId, managementApiKey }) => {
    // write env vars to .env.development & .env.production
    const dotenv = [
      `# All environment variables will be sourced`,
      `# and made available to gatsby-config.js, gatsby-node.js, etc.`,
      `# Do NOT commit this file to source control`,
      `KONTENT_PROJECT_ID="${projectId}"`,
    ].join("\n")

    const configFiles = [".env.development", ".env.production"]
      .map((name) => path.join(__dirname, "..", name))
      .forEach((filename) => {
        fs.writeFileSync(filename, dotenv, "utf8")
      })

    console.log(`.env files written`)

    return { projectId, managementApiKey }
  })
  .then(({ projectId, managementApiKey }) => {
    return importData(projectId, managementApiKey)
  })
  .then((_, error) => {
    console.log(
      `All set! You can now run ${chalk.yellow(
        "yarn start"
      )} to see it in action.`
    )
  })
  .catch((err) => {
    console.error(err)
  })
