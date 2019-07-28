import * as mongoose from 'mongoose'
import { AbilityBuilder } from '@casl/ability'
import { accessibleRecordsPlugin } from '@casl/mongoose'

mongoose.plugin(accessibleRecordsPlugin)

mongoose.set('debug', true)

const ability = AbilityBuilder.define((can) => {
  can('read', 'Page', { public: true })
  can('read', 'BlogPost')
})

const PageSchema = new mongoose.Schema({
  title: String,
  description: String,
  public: { type: Boolean, default: false }
}, {
  discriminatorKey: 'type'
})

const Page = mongoose.model('Page', PageSchema)
const BlogPost = Page.discriminator('BlogPost', new mongoose.Schema({
  comments: [String],
}))

async function main() {
  await mongoose.connect('mongodb://localhost/casl_test')
  const amountOfPosts = await Page.count({})

  if (!amountOfPosts) {
    await Promise.all([
      Page.create({
        title: 'About',
        description: ':)',
        public: true
      }),
      Page.create({
        title: 'Home',
        description: 'description'
      }),
      BlogPost.create({
        title: 'My blog post',
        comments: ['comment 1', 'comment 2'],
        public: true
      })
    ])
  }

  const pages = await BlogPost.accessibleBy(ability)

  return pages
}

main()
  .then(console.log)
  .catch(console.error)
  .then(() => mongoose.connection.close())
