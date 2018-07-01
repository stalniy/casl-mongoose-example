const mongoose = require('mongoose')
const { AbilityBuilder } = require('@casl/ability')
const { accessibleRecordsPlugin, permittedFieldsPlugin } = require('@casl/mongoose')
const { pick } = require('lodash')

mongoose.plugin(accessibleRecordsPlugin)
mongoose.plugin(permittedFieldsPlugin)

const ability = AbilityBuilder.define((can) => {
  can('read', 'Post', ['id', 'title'], { user: 1 })
})

const PostSchema = mongoose.Schema({
  title: String,
  description: String,
  user: Number
})

const Post = mongoose.model('Post', PostSchema)

async function main() {
  await mongoose.connect('mongodb://localhost/casl_test')

  if (!(await Post.count())) {
    await Promise.all([
      Post.create({ title: 'My post', user: 1, description: ':)' }),
      Post.create({ title: 'Not my post', user: 2, description: 'description' })
    ])
  }

  const posts = await Post.accessibleBy(ability)

  return posts.map(post => pick(post, post.permittedFieldsBy(ability)))
}

main()
  .then(console.log)
  .catch(console.error)
