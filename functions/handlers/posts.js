    const { db } = require('../util/admin') 

function isMaxLength(value, maxLength) {
    if(value.length > maxLength) return true
    return false
}

exports.getAllPosts = (req,res) => {
    db.collection('posts').orderBy('createdAt', 'desc').get().then(data => {
        let posts = [] 
        data.forEach(doc => {
            posts.push({
                postId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt,
                commentCount: doc.data().commentCount,
                likeCount: doc.data().likeCount,
                userImage: doc.data().userImage
            })
        }) 
        console.log('data',data) 
        return res.status(200).json(posts)
    }).catch(err => {
        console.log('error', err)
        return res.status(500).json({error: 'Something went wrong'})
    })
}


exports.addNewPost = (req,res) => {
    if (req.body.body.trim() === '') {
        return res.status(400).json({ body: 'Body must not be empty' }) 
    }

    if(isMaxLength(req.body.body,250)) return res.status(400).json({error: 'Max length of the post is 250'})

    const newPost = {
        body: req.body.body,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl,
        createdAt: new Date().toISOString(),
        likeCount: 0,
        commentCount: 0
    } 

    db.collection('posts')
        .add(newPost)
        .then((doc) => {
            const resPost = newPost 
            resPost.postId = doc.id 
            res.json(resPost) 
        })
        .catch((err) => {
            res.status(500).json({ error: err.code }) 
            console.error(err) 
        }) 
}

exports.getPostById = (req,res) => {
    if (req.method === 'OPTIONS') {
        res.end() 
    }
    let postData = {} 
    db.doc(`/posts/${req.params.postId}`).get()
        .then(doc => {
            if (!doc.exists) {
                return res.status(400).json({ error: 'Post not found' }) 
            }
            postData = doc.data() 
            postData.postId = doc.id 
            return db
                .collection('comments')
                .orderBy('createdAt', 'desc')
                .where('postId', '==', req.params.postId)
                .get() 
        }).then((data) => {
        postData.comments = [] 
        data.forEach((doc) => {
            const resComment = {
                body: doc.data().body,
                createdAt: doc.data().createdAt,
                postId: doc.data().postId,
                userHandle: doc.data().userHandle,
                userImage: doc.data().userImage,
                commentId: doc.id
            }
            postData.comments.push(resComment) 
        }) 
        return res.status(200).json(postData) 
    }).catch(err => {
        console.error('error ', err)
        return res.status(500).json({error: err})
    })
}

exports.commentOnPost = (req, res) => {

    if(isMaxLength(req.body.body,230)){return res.status(400).json({error: 'Max length of the comment is 230'})}

    const newComment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        postId: req.params.postId,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl
    } 

    db.doc(`/posts/${req.params.postId}`)
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return res.status(400).json({ error: 'Post not found' }) 
            }
            doc.ref.update({ commentCount: doc.data().commentCount + 1 }) 
        })
        .then(() => {
            return db.collection('comments').add(newComment) 
        })
        .then((doc) => {
            const resComment = newComment
            resComment.commentId = doc.id
            res.status(200).json(resComment) 
        })
        .catch((err) => {
            console.log(err) 
            res.status(500).json({ error: err.code }) 
        }) 
} 

exports.deleteComment = (req, res) => {
    const document = db.doc(`/comments/${req.params.commentId}`) 
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return res.status(400).json({ error: 'Comment not found' }) 
            }
            if (doc.data().userHandle !== req.user.handle) {
                return res.status(400).json({ error: 'Unauthorized' }) 
            } else {
                return db.doc(`/posts/${req.params.postId}`).update({ commentCount: doc.data().commentCount - 1 }) 
            }
        })
        .then(() => {
            return document.delete() 
        })
        .then(() => {
            res.status(200).json({ message: 'Comment deleted successfully' }) 
        })
        .catch((err) => {
            return res.status(500).json({ error: err.code }) 
        }) 
} 


exports.likePost = (req, res) => {
    const likeDocument = db
        .collection('likes')
        .where('userHandle', '==', req.user.handle)
        .where('postId', '==', req.params.postId)
        .limit(1) 

    const postDocument = db.doc(`/posts/${req.params.postId}`) 

    let postData 

    postDocument
        .get()
        .then((doc) => {
            if (doc.exists) {
                postData = doc.data() 
                postData.postId = doc.id 
                return likeDocument.get() 
            } else {
                return res.status(400).json({ error: 'Post not found' }) 
            }
        })
        .then((data) => {
            if (data.empty) {
                return db
                    .collection('likes')
                    .add({
                        postId: req.params.postId,
                        userHandle: req.user.handle
                    })
                    .then(() => {
                        postData.likeCount++ 
                        return postDocument.update({ likeCount: postData.likeCount }) 
                    })
                    .then(() => {
                        return res.json(postData) 
                    }) 
            } else {
                return res.status(400).json({ error: 'Post already liked' }) 
            }
        })
        .catch((err) => {
            console.error(err) 
            res.status(500).json({ error: err.code }) 
        }) 
} 

exports.unlikePost = (req, res) => {
    const likeDocument = db
        .collection('likes')
        .where('userHandle', '==', req.user.handle)
        .where('postId', '==', req.params.postId)
        .limit(1) 

    const postDocument = db.doc(`/posts/${req.params.postId}`) 

    let postData 

    postDocument
        .get()
        .then((doc) => {
            if (doc.exists) {
                postData = doc.data() 
                postData.postId = doc.id 
                return likeDocument.get() 
            } else {
                return res.status(400).json({ error: 'Post not found' }) 
            }
        })
        .then((data) => {
            if (data.empty) {
                return res.status(400).json({ error: 'Post not liked' }) 
            } else {
                return db
                    .doc(`/likes/${data.docs[0].id}`)
                    .delete()
                    .then(() => {
                        postData.likeCount-- 
                        return postDocument.update({ likeCount: postData.likeCount }) 
                    })
                    .then(() => {
                        res.json(postData) 
                    }) 
            }
        })
        .catch((err) => {
            console.error(err) 
            res.status(500).json({ error: err.code }) 
        }) 
} 
// Delete a post
exports.deletePost = (req, res) => {
    const document = db.doc(`/posts/${req.params.postId}`) 
    document
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return res.status(400).json({ error: 'Post not found' }) 
            }
            if (doc.data().userHandle !== req.user.handle) {
                return res.status(403).json({ error: 'Unauthorized' }) 
            } else {
                return document.delete() 
            }
        })
        .then(() => {
            res.status(200).json({ message: 'Post deleted successfully' }) 
        })
        .catch((err) => {
            console.error(err) 
            return res.status(500).json({ error: err.code }) 
        }) 
} 

