const mongoose = require('mongoose')

const commentSchema = mongoose.Schema({
	comment: String,
})

commentSchema.set('toJSON', {
	transform: (document, returnedObject) => {
		delete returnedObject.__v
	}
})

module.exports = mongoose.model('Comment', commentSchema)