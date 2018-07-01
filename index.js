const mongoose = require('mongoose')
const { AbilityBuilder } = require('@casl/ability')
const { accessibleRecordsPlugin, permittedFieldsPlugin } = require('@casl/mongoose')
const { pick } = require('lodash')

mongoose.plugin(accessibleRecordsPlugin)
mongoose.plugin(permittedFieldsPlugin)

const ability = AbilityBuilder.define((can) => {
  can('read', 'Post', ['id', 'title'], { public: true })
  can('read', 'Post', ['id', 'description', 'title'], { public: false })
})

const PostSchema = mongoose.Schema({
  title: String,
  description: String,
  public: { type: Boolean, default: false }
})

const Post = mongoose.model('Post', PostSchema)

async function main() {
  await mongoose.connect('mongodb://localhost/casl_test')

  if (!(await Post.count())) {
    await Promise.all([
      Post.create({
        title: 'My post',
        description: ':)',
        public: true
      }),
      Post.create({
        title: 'Not my post',
        description: 'description'
      })
    ])
  }

  const query = Post.accessibleBy(ability)
  const posts = await query.exec()
  const postsUsingSelect = await query.select(Post.permittedFieldsBy(ability).join(' '))

  return {
    // because posts with `public: true` should not contain `description` field
    incorrect: postsUsingSelect,

    // the next results are correct
    correct: posts.map(post => pick(post, post.permittedFieldsBy(ability))),
  }
}

main()
  .then(console.log)
  .catch(console.error)
