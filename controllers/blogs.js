const router = require('express').Router()
const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')
const User = require('../models/user')
const Comment = require('../models/comment')

router.get('/', async (request, response) => {
	const blogs = await Blog
		.find({})
		.populate('user', { username: 1, name: 1 })
		.populate('comments')

	response.json(blogs)
})

router.delete('/:id', async (request, response) => {
	const decodedToken = jwt.verify(request.token, process.env.SECRET)

	if (!request.token || !decodedToken.id) {
		return response.status(401).json({ error: 'token missing or invalid' })
	}

	const user = await User
		.findById(decodedToken.id)
	const blog = await Blog
		.findById(request.params.id)
	if (blog.user.toString() !== user.id.toString()) {
		return response.status(401).json({ error: 'only the creator can delete blogs' })
	}

	await blog.remove()
	user.blogs = user.blogs.filter(b => b.id.toString() !== request.params.id.toString())
	await user.save()
	response.status(204).end()
})

router.put('/:id', async (request, response) => {
	console.log('requestBody: ', request.body)
	const blog = request.body
	console.log('blog: ', blog)
	const updatedBlog = await Blog
		.findByIdAndUpdate(request.params.id, blog, { new: true, populate: { path: 'user' } })
	console.log('updatedBlog: ', updatedBlog)
	response.json(updatedBlog.toJSON())
})

router.post('/', async (request, response) => {
	console.log('request.token: ', request.token)
	const blog = new Blog(request.body)
	const decodedToken = jwt.verify(request.token, process.env.SECRET)
	console.log('dekodedToken: ', decodedToken)
	if (!request.token || !decodedToken.id) {
		return response.status(401).json({ error: 'token missing or invalid' })
	}
	const user = await User
		.findById(decodedToken.id)
	console.log('userAfterAwait: ', user)
	if (!blog.url || !blog.title) {
		console.log('userInsideIf: ', user)
		return response.status(400).send({ error: 'title or url missing ' })
	}
	if (!blog.likes) {
		blog.likes = 0
	}
	blog.user = user
	const savedBlog = await blog.save()
	console.log('beforeUserBlogs: ', user.blogs)
	user.blogs = user.blogs.concat(savedBlog._id)
	console.log('userBlogs: ', user.blogs)
	await user.save()
	response.status(201).json(savedBlog)
})

router.post('/:id/comments', async (request, response) => {
	const comment = new Comment ({ comment: request.body.comment })
	const savedComment = await comment.save()
	const blog = await Blog.findById(request.params.id)
	blog.comments = blog.comments.concat(savedComment._id)
	const savedBlog = await blog.save()
	const populatedBlog = await Blog.find(savedBlog).populate('comments')
	response.status(201).json(populatedBlog)
})

module.exports = router