import React, { useEffect, useState } from "react"
import { connect } from "react-redux"
import { Link, withRouter } from "react-router-dom"
import classes from './Post.module.scss'
import { likePost, unLikePost } from "../../store/homeReducer"
import { getPostDataById } from "../../store/fullPostReducer"
import PostContent from "./PostContent/PostContent"
import DeletePost from "./DeletePost"
import FullPostModal from "../modals/FullPostModal/FullPostModal"

const Post = ({isAuth,post,likePost,likedPosts,unLikePost,getPostDataById,credentials,commentModalOpen = false,history}) => {
    const[isAuthUserPost,setIsAuthUserPost] = useState(false)
    const[isCommentModal,setIsCommentModal] = useState(false)
    const[oldPathState,setOldPath] = useState(null)
    const[isPostLiked,setIsPostLiked] = useState(false)

    useEffect(() => {
        if(credentials && credentials.handle === post.userHandle){
            setIsAuthUserPost(true)
        } else {
            setIsAuthUserPost(false)
        }

        if(likedPosts && likedPosts.some(likedPost => likedPost.postId === post.postId)){
            setIsPostLiked(true)
        } else {
            setIsPostLiked(false)
        }
    },[credentials,likedPosts,post.userHandle,post.postId])

    useEffect(() => {
        if(commentModalOpen){
            openCommentModal()
        }
    },[commentModalOpen])

    const likePostHandler = () => {
        if(!isAuth){
            history.push('/login')
        }
        likePost(post.postId)
    }

    const unLikePostHandler = () => {
        if(!isAuth){
            history.push('/login')
        }
        unLikePost(post.postId)
    }

    const openCommentModal = () => {
        let oldPath = window.location.pathname
        const userHandle = Array.from(post.userHandle).map(char => char === ' ' ? '%20' : char ).join('')
        const newPath = `/users/${userHandle}/post/${post.postId}`

        if (oldPath === newPath) oldPath = `/users/${userHandle}`
        window.history.pushState(null, null, newPath)

        setOldPath(oldPath)
        getPostDataById(post.postId)
        setIsCommentModal(true)
    }

    const closeCommentModal = () => {
        const userHandle = Array.from(post.userHandle).map(char => char === ' ' ? '%20' : char ).join('')
        const path = oldPathState || `/users/${userHandle}`
        history.push(path)
        setIsCommentModal(false)
    }

    return (
        <div className={classes.post}>
             <Link to={`/users/${post.userHandle}`}>
                <div className={classes.userPhoto} style={{background: `rgba(0,0,0,.5) url(${post.userImage}) center / cover no-repeat`}}/>
            </Link>
            <PostContent
                post={post}
                isPostLiked={isPostLiked}
                likePost={likePostHandler}
                unLikePost={unLikePostHandler}
                openCommentModal={openCommentModal}
                likeCount={post.likeCount}
                commentCount={post.commentCount}
            />
            <FullPostModal
                isPostLiked={isPostLiked}
                credentials={credentials}
                likePost={likePostHandler}
                unLikePost={unLikePostHandler}
                closeCommentModal={closeCommentModal}
                likeCount={post.likeCount}
                commentCount={post.commentCount}
                closeModal={closeCommentModal}
                isCommentModal={isCommentModal}
            />
            <DeletePost isAuthUserPost={isAuthUserPost} deletedPost={post.postId}/>
        </div>
    )
}

const mapStateToProps = state => ({
    isAuth: state.auth.isAuth,
    likedPosts: state.profilePage.likes,
    credentials: state.profilePage.credentials
})

export default withRouter(connect(mapStateToProps,{likePost,unLikePost,getPostDataById})(Post))