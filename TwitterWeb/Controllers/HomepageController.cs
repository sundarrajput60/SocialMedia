using System;
using System.Collections.Generic;
using System.Data.Entity;
using System.Data.SqlClient;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using TwitterWeb.Models;

namespace TwitterWeb.Controllers
{
    public class HomepageController : Controller
    {
        DBContext db = new DBContext();

        // GET: Homepage
        public ActionResult Index()
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }
            return View();
        }

        public ActionResult ComingSoon()
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }
            return View();
        }


        [HttpGet]
        public ActionResult GetUser(int id)
        {

            var result = db.Database.SqlQuery<string>("EXEC FindUser @UserId", new SqlParameter("UserId", id)).FirstOrDefault();

            Session["UserId"] = id;
            Session["UserName"] = result;
            return RedirectToAction("Index");
        }

        [HttpGet]
        [Route("GetAllTweets")]
        public ActionResult GetAllTweets()
        {
            if (Session["UserId"] == null)
            {
                return Json("Please Login", JsonRequestBehavior.AllowGet);
            }
            var userId = (int)Session["UserId"];
            try
            {
                // Fetch tweets
                var tweets = (from tweet in db.UsersTweets
                              join user in db.Users on tweet.UserId equals user.UserId
                              where tweet.IsDeleted == null 
                              select new
                              {
                                  TweetId = tweet.TweetId,
                                  TweetText = tweet.TweetText,
                                  TweetImg = tweet.TweetImg,
                                  TweetPostedTime = tweet.TweetPostedTime,
                                  LikeCount = tweet.LikeCount,
                                  CommentCount = tweet.CommentCount,
                                  UserId = user.UserId,
                                  UserName = user.UserName,
                                  FirstName = user.FirstName,
                                  ProfilePic = user.ProfilePic,
                                  IsLiked = db.LikeTweets.Any(lt => lt.TweetId == tweet.TweetId && lt.UserId == userId),
                                  Comments = (from comment in db.CommentTweets
                                              join commentUser in db.Users on comment.UserId equals commentUser.UserId
                                              where comment.TweetId == tweet.TweetId && comment.IsDeleted == null
                                              select new
                                              {
                                                  CommentId = comment.CommentId,
                                                  CommentText = comment.CommentText,
                                                  CommentDate = comment.CommentDate,
                                                  UserId = commentUser.UserId,
                                                  UserName = commentUser.UserName,
                                                  FirstName = commentUser.FirstName,
                                                  ProfilePic = commentUser.ProfilePic,
                                                  Replies = (from reply in db.CommentReplies
                                                             join replyUser in db.Users on reply.UserId equals replyUser.UserId
                                                             where reply.CommentId == comment.CommentId
                                                             select new
                                                             {
                                                                 ReplyId = reply.ReplyId,
                                                                 ReplyText = reply.ReplyText,
                                                                 ReplyDate = reply.ReplyDate,
                                                                 UserId = replyUser.UserId,
                                                                 UserName = replyUser.UserName,
                                                                 FirstName = replyUser.FirstName,
                                                                 ProfilePic = replyUser.ProfilePic
                                                             }).ToList()
                                              }).ToList()
                              }).ToList();

                var loggedInUserId = new
                {
                    userId = Session["UserId"]
                };

                return Json(new { Tweets = tweets, loggedInUserId = loggedInUserId }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        [Route("GetUserTweets")]
        public ActionResult GetUserTweets()
        {
            try
            {
                var id = 0;
                if(Session["UserId"] != null)
                {
                    id = (int)Session["UserId"];
                }

                // Fetch tweets
                var tweets = (from tweet in db.UsersTweets
                              join user in db.Users on tweet.UserId equals user.UserId
                              where tweet.UserId == id && tweet.IsDeleted == null
                              select new
                              {
                                  TweetId = tweet.TweetId,
                                  TweetText = tweet.TweetText,
                                  TweetImg = tweet.TweetImg,
                                  TweetPostedTime = tweet.TweetPostedTime,
                                  LikeCount = tweet.LikeCount,
                                  CommentCount = tweet.CommentCount,
                                  UserId = user.UserId,
                                  UserName = user.UserName,
                                  FirstName = user.FirstName,
                                  ProfilePic = user.ProfilePic,
                                  Comments = (from comment in db.CommentTweets
                                              join commentUser in db.Users on comment.UserId equals commentUser.UserId
                                              where comment.TweetId == tweet.TweetId && comment.IsDeleted == null
                                              select new
                                              {
                                                  CommentId = comment.CommentId,
                                                  CommentText = comment.CommentText,
                                                  CommentDate = comment.CommentDate,
                                                  UserId = commentUser.UserId,
                                                  UserName = commentUser.UserName,
                                                  FirstName = commentUser.FirstName,
                                                  ProfilePic = commentUser.ProfilePic
                                              }).ToList()
                              }).ToList();

                var loggedInUserId = new
                {
                    userId = Session["UserId"]
                };


                var data = new
                {
                    Tweets = tweets,
                    loggedInUserId = loggedInUserId
                };

                // Return the custom object as JSON
                return Json(data, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { error = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        [Route("DeleteTweet")]
        public ActionResult DeleteTweet(int tweetId)
        {
            // Check if the tweet exists
            var tweet = db.UsersTweets.Find(tweetId);
            if (tweet != null)
            {
                db.Database.ExecuteSqlCommand("EXEC DeleteTweetCommentLike @TweetId", new SqlParameter("@TweetId", tweetId));

                return Json("deleted", JsonRequestBehavior.AllowGet);
            }

            return Json("Tweet not found", JsonRequestBehavior.AllowGet);
        }

        [Route("LikeCountTweet")]
        [HttpPost]
        public ActionResult LikeCountTweet(int tweetId, int userId)
        {
            
            // Check if the user has already liked the tweet
            var existingLike = db.LikeTweets.FirstOrDefault(l => l.TweetId == tweetId && l.UserId == userId);

            if (existingLike != null)
            {
                InsertLikeNotification(userId, tweetId);
                // User has already liked the tweet, remove the like
                db.LikeTweets.Remove(existingLike);

                // Update the like count in the UsersTweet table
                var tweet = db.UsersTweets.FirstOrDefault(t => t.TweetId == tweetId);
                if (tweet != null && tweet.LikeCount > 0)
                {
                    tweet.LikeCount--; // Decrement the like count
                    db.Entry(tweet).State = EntityState.Modified;
                }

                db.SaveChanges();

                // Return the updated like count
                int likeCount = 0;
                if (tweet != null && tweet.LikeCount.HasValue)
                {
                    likeCount = tweet.LikeCount.Value;
                }
                return Json(new { success = true, likeCount = likeCount }, JsonRequestBehavior.AllowGet);
            }
            else
            {
                InsertLikeNotification(userId, tweetId);
                // User hasn't liked the tweet, add a new like
                LikeTweet like = new LikeTweet
                {
                    TweetId = tweetId,
                    UserId = userId,
                    LikedDate = DateTime.Now
                };
                db.LikeTweets.Add(like);

                // Update the like count in the UsersTweet table
                var tweet = db.UsersTweets.FirstOrDefault(t => t.TweetId == tweetId);
                if (tweet != null)
                {
                    tweet.LikeCount++; // Increment the like count
                    db.Entry(tweet).State = EntityState.Modified;
                }

                db.SaveChanges();

                // Return the updated like count
                int likeCount = 0;
                if (tweet != null && tweet.LikeCount.HasValue)
                {
                    likeCount = tweet.LikeCount.Value;
                }
                return Json(new { success = true, likeCount = likeCount }, JsonRequestBehavior.AllowGet);
            }

            void InsertLikeNotification(int notificationUserId, int notificationTweetId)
            {
                db.Database.ExecuteSqlCommand("EXEC LikeNotification @UserId, @TweetId",
                                           new SqlParameter("UserId", notificationUserId),
                                           new SqlParameter("TweetId", notificationTweetId));

                db.SaveChanges();
            }
        }

        [Route("UserCommentTweet")]
        [HttpPost]
        public ActionResult UserCommentTweet(int tweetId, int userId, string commentText)
        {
            // Create a new comment
            var CommentTweet = new CommentTweet
            {
                TweetId = tweetId,
                UserId = userId,
                CommentText = commentText,
                CommentDate = DateTime.Now
            };

            db.CommentTweets.Add(CommentTweet);

            //Inserting comment notification record
            InsertCommentNotification(userId, tweetId);

            // Increment the comment count
            IncrementCommentCount(tweetId);

            // Fetch user data for the comment
            var user = db.Users.FirstOrDefault(u => u.UserId == userId);

            // Return the updated comment count, comment data, and user data
            var tweet = db.UsersTweets.FirstOrDefault(t => t.TweetId == tweetId);
            int commentCount = tweet?.CommentCount ?? 0;

            return Json(new
            {
                success = true,
                commentCount = commentCount,
                comment = new
                {
                    CommentId = CommentTweet.CommentId,
                    tweetId = tweetId,
                    CommentText = commentText,
                    UserName = user?.UserName,
                    FirstName = user?.FirstName,
                    ProfilePic = user?.ProfilePic,
                    CommentDate = CommentTweet.CommentDate
                },
                user = new
                {
                    UserId = user?.UserId,
                    UserName = user?.UserName,
                    FirstName = user?.FirstName,
                    ProfilePic = user?.ProfilePic
                }
            }, JsonRequestBehavior.AllowGet);
        }

        // Method to insert comment notification
        private void InsertCommentNotification(int notificationUserId, int notificationTweetId)
        {
            db.Database.ExecuteSqlCommand("EXEC CommentNotification @UserId, @TweetId",
                                           new SqlParameter("UserId", notificationUserId),
                                           new SqlParameter("TweetId", notificationTweetId));
            db.SaveChanges();
        }

        // Method to increment the comment count
        private void IncrementCommentCount(int tweetId)
        {
            var tweet = db.UsersTweets.FirstOrDefault(t => t.TweetId == tweetId);
            if (tweet != null)
            {
                tweet.CommentCount++; // Increment the comment count
                db.Entry(tweet).State = EntityState.Modified;
                db.SaveChanges();
            }
        }

        [Route("DeleteComment")]
        [HttpGet]
        public ActionResult DeleteComment(int commentId)
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }

            var userId = (int)Session["UserId"];
            var commentTweet = db.CommentTweets.Find(commentId);
            

            if (commentTweet != null)
            {
                db.Database.ExecuteSqlCommand("EXEC DeleteCommentWithReplies @CommentId", new SqlParameter("@CommentId", commentId));
                db.SaveChanges();
                var userTweet = db.UsersTweets.Find(commentTweet.TweetId);

                if (userTweet != null)
                {
                    //commentTweet.IsDeleted = true;
                    InsertCommentNotification(userId, userTweet.TweetId);
                    // Decrease the comment count
                    DecreaseCommentCount(userTweet);

                    // Delete comment notification
                    DeleteCommentNotification(userId, commentTweet.TweetId);

                    return Json(new { success = true, commentCount = userTweet.CommentCount, tweetId = userTweet.TweetId }, JsonRequestBehavior.AllowGet);
                }
            }
            return Json(new { success = false, message = "Comment not found or already deleted" }, JsonRequestBehavior.AllowGet);
        }

        // Method to decrease the comment count
        private void DecreaseCommentCount(UsersTweet userTweet)
        {
            if (userTweet != null)
            {
                userTweet.CommentCount--;
                db.SaveChanges();
            }
        }

        // Method to delete comment notification
        private void DeleteCommentNotification(int notificationUserId, int? notificationTweetId)
        {
            db.Database.ExecuteSqlCommand("EXEC DeleteCommentNotification  @UserId, @TweetId",
                                           new SqlParameter("UserId", notificationUserId),
                                           new SqlParameter("TweetId", notificationTweetId));
            db.SaveChanges();
        }

        [Route("UserReplyComment")]
        [HttpPost]
        public ActionResult UserReplyComment(int commentId, string replyText, int tweetId)
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }
            var userId = (int)Session["UserId"];
            var reply = new CommentReply
            {
                CommentId = commentId,
                ReplyText = replyText,
                UserId = userId,
                ReplyDate = DateTime.Now
            };

            db.CommentReplies.Add(reply);
            db.SaveChanges();
            IncrementCommentCount(tweetId);

            var tweetCommetCount = db.UsersTweets.FirstOrDefault(t => t.TweetId == tweetId);
            int commentCount = tweetCommetCount?.CommentCount ?? 0;

            var user = db.Users.FirstOrDefault(u => u.UserId == userId);

            return Json(new
            {
                success = true,
                commentCount = commentCount,
                reply = new
                {
                    ReplyId = reply.ReplyId,
                    CommentId = commentId,
                    ReplyText = replyText,
                    UserName = user?.UserName,
                    FirstName = user?.FirstName,
                    ProfilePic = user?.ProfilePic,
                    ReplyDate = reply.ReplyDate,
                    UserId = userId
                }
            }, JsonRequestBehavior.AllowGet);
        }

        [Route("DeleteCommentReply")]
        [HttpPost]
        public ActionResult DeleteCommentReply(int tweetId, int commentId, int commentReplyId)
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }

            var userId = (int)Session["UserId"];
            try
            {
                var reply = db.CommentReplies.FirstOrDefault(r => r.ReplyId == commentReplyId);
                if (reply != null)
                {
                    db.CommentReplies.Remove(reply);
                    db.SaveChanges();

                    //decrease commentcount
                    var tweet = db.UsersTweets.FirstOrDefault(t => t.TweetId == tweetId);
                    if (tweet != null)
                    {
                        tweet.CommentCount--; // Increment the comment count
                        db.Entry(tweet).State = EntityState.Modified;
                        db.SaveChanges();
                    }

                    var tweetCommetCount = db.UsersTweets.FirstOrDefault(t => t.TweetId == tweetId);
                    int commentCount = tweetCommetCount?.CommentCount ?? 0;
                    // Return success response
                    return Json(new { success = true, message = "Reply deleted successfully", commentCount }, JsonRequestBehavior.AllowGet);
                }
                return Json(new { success = false, message = "Reply not found" }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [Route("AllUsers")]
        [HttpGet]
        public ActionResult AllUsers()
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }
            return View();
        }

        [Route("GetAllUsers")]
        [HttpGet]
        public ActionResult GetAllUsers()
        {
            if (Session["UserId"] == null)
            {
                return Json("Please, login again", JsonRequestBehavior.AllowGet);
            }

            int currentUserId = (int)Session["UserId"];

            var users = db.Users
                .Where(user => user.UserId != currentUserId) // Exclude the logged-in user
                .GroupJoin(
                    db.FollowUsers.Where(f => f.SenderId == currentUserId || f.ReceiverId == currentUserId),
                    user => user.UserId,
                    follow => follow.ReceiverId == currentUserId ? follow.SenderId : follow.ReceiverId,
                    (user, followGroup) => new
                    {
                        User = user,
                        Follow = followGroup.FirstOrDefault(f => f.SenderId == currentUserId || f.ReceiverId == currentUserId)
                    })
                .Where(x => x.Follow == null || x.Follow.FollowStatus == "pending" || x.Follow.FollowStatus == "rejected" || x.Follow.IsFriend == false)
                .Select(x => new
                {
                    UserId = x.User.UserId,
                    FirstName = x.User.FirstName,
                    UserName = x.User.UserName,
                    ProfilePic = x.User.ProfilePic,
                    FollowStatus = x.Follow != null ? x.Follow.FollowStatus : null,
                    IsFriend = x.Follow != null ? x.Follow.IsFriend : false
                })
                .ToList();

            return Json(users, JsonRequestBehavior.AllowGet);
        }


        [HttpPost]
        [Route("FollowUser")]
        public ActionResult FollowUser(int ReceiverId)
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }

            var senderId = Session["UserId"];
            db.Database.ExecuteSqlCommand("EXEC SpFollowUser @SenderId, @ReceiverId",
                                             new SqlParameter("SenderId", senderId),
                                             new SqlParameter("ReceiverId", ReceiverId));

            db.SaveChanges();

            return Json("User added succesfully", JsonRequestBehavior.AllowGet);
        }

        public ActionResult Notification()
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }
            return View();
        }

        [HttpGet]
        [Route("GetAllNotification")]
        public ActionResult GetAllNotification()
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }

            var userId = (int)Session["UserId"];

            var notifications = (from un in db.UserNotifications
                                 join u in db.Users on un.UserId equals u.UserId
                                 join t in db.UsersTweets on un.TweetId equals t.TweetId
                                 where un.UserId != userId && t.UserId == userId
                                 select new 
                                 {
                                     NotificationId = un.NotificationId,
                                     NotificationText = un.NotificationText,
                                     NotificationTime = un.NotificationTime,
                                     NotifierUserId = u.UserId,
                                     NotifierUserName = u.UserName,
                                     NotifierFirstName = u.FirstName,
                                     NotifierProfilePic = u.ProfilePic,
                                     TweetText = t.TweetText,
                                     TweetImage = t.TweetImg
                                 }).ToList();

            return Json(notifications, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        [Route("searchHashtag")]
        public ActionResult searchHashtag(string searchText)
        {
            //using (db)
            //{
            //    var result = db.Database.SqlQuery<UsersTweet>("EXEC SearchHashtag @SearchText", new SqlParameter("@SearchText", searchText)).ToList();

            //    return Json(result, JsonRequestBehavior.AllowGet);
            //}

            if (Session["UserId"] == null)
            {
                return Json("Please Login", JsonRequestBehavior.AllowGet);
            }

            var userId = (int)Session["UserId"];

            try
            {
                // Fetch tweets that match the search text
                var tweets = (from tweet in db.UsersTweets
                              join user in db.Users on tweet.UserId equals user.UserId
                              where tweet.IsDeleted == null && tweet.TweetText.Contains(searchText)
                              select new
                              {
                                  TweetId = tweet.TweetId,
                                  TweetText = tweet.TweetText,
                                  TweetImg = tweet.TweetImg,
                                  TweetPostedTime = tweet.TweetPostedTime,
                                  LikeCount = tweet.LikeCount,
                                  CommentCount = tweet.CommentCount,
                                  UserId = user.UserId,
                                  UserName = user.UserName,
                                  FirstName = user.FirstName,
                                  ProfilePic = user.ProfilePic,
                                  IsLiked = db.LikeTweets.Any(lt => lt.TweetId == tweet.TweetId && lt.UserId == userId),
                                  Comments = (from comment in db.CommentTweets
                                              join commentUser in db.Users on comment.UserId equals commentUser.UserId
                                              where comment.TweetId == tweet.TweetId && comment.IsDeleted == null
                                              select new
                                              {
                                                  CommentId = comment.CommentId,
                                                  CommentText = comment.CommentText,
                                                  CommentDate = comment.CommentDate,
                                                  UserId = commentUser.UserId,
                                                  UserName = commentUser.UserName,
                                                  FirstName = commentUser.FirstName,
                                                  ProfilePic = commentUser.ProfilePic,
                                                  Replies = (from reply in db.CommentReplies
                                                             join replyUser in db.Users on reply.UserId equals replyUser.UserId
                                                             where reply.CommentId == comment.CommentId
                                                             select new
                                                             {
                                                                 ReplyId = reply.ReplyId,
                                                                 ReplyText = reply.ReplyText,
                                                                 ReplyDate = reply.ReplyDate,
                                                                 UserId = replyUser.UserId,
                                                                 UserName = replyUser.UserName,
                                                                 FirstName = replyUser.FirstName,
                                                                 ProfilePic = replyUser.ProfilePic
                                                             }).ToList()
                                              }).ToList()
                              }).ToList();

                var loggedInUserId = new
                {
                    userId = Session["UserId"]
                };

                return Json(new { Tweets = tweets, loggedInUserId = loggedInUserId }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }

        }

        [HttpGet]
        [Route("topHashtag")]
        public ActionResult topHashtag() 
        {
            var result = db.Database.SqlQuery<string>("EXEC TopHashtag").ToList();
            return Json(result, JsonRequestBehavior.AllowGet);
        }

        [HttpGet]
        [Route("GetTweetByHashtagName")]
        public ActionResult GetTweetByHashtagName(string hashtagName)
        {
            if (Session["UserId"] == null)
            {
                return Json("Please Login", JsonRequestBehavior.AllowGet);
            }

            var userId = (int)Session["UserId"];

            try
            {
                // Fetch tweets that match the search text
                var tweets = (from tweet in db.UsersTweets
                              join user in db.Users on tweet.UserId equals user.UserId
                              where tweet.IsDeleted == null && tweet.TweetText.Contains(hashtagName)
                              select new
                              {
                                  TweetId = tweet.TweetId,
                                  TweetText = tweet.TweetText,
                                  TweetImg = tweet.TweetImg,
                                  TweetPostedTime = tweet.TweetPostedTime,
                                  LikeCount = tweet.LikeCount,
                                  CommentCount = tweet.CommentCount,
                                  UserId = user.UserId,
                                  UserName = user.UserName,
                                  FirstName = user.FirstName,
                                  ProfilePic = user.ProfilePic,
                                  IsLiked = db.LikeTweets.Any(lt => lt.TweetId == tweet.TweetId && lt.UserId == userId),
                                  Comments = (from comment in db.CommentTweets
                                              join commentUser in db.Users on comment.UserId equals commentUser.UserId
                                              where comment.TweetId == tweet.TweetId && comment.IsDeleted == null
                                              select new
                                              {
                                                  CommentId = comment.CommentId,
                                                  CommentText = comment.CommentText,
                                                  CommentDate = comment.CommentDate,
                                                  UserId = commentUser.UserId,
                                                  UserName = commentUser.UserName,
                                                  FirstName = commentUser.FirstName,
                                                  ProfilePic = commentUser.ProfilePic,
                                                  Replies = (from reply in db.CommentReplies
                                                             join replyUser in db.Users on reply.UserId equals replyUser.UserId
                                                             where reply.CommentId == comment.CommentId
                                                             select new
                                                             {
                                                                 ReplyId = reply.ReplyId,
                                                                 ReplyText = reply.ReplyText,
                                                                 ReplyDate = reply.ReplyDate,
                                                                 UserId = replyUser.UserId,
                                                                 UserName = replyUser.UserName,
                                                                 FirstName = replyUser.FirstName,
                                                                 ProfilePic = replyUser.ProfilePic
                                                             }).ToList()
                                              }).ToList()
                              }).ToList();

                var loggedInUserId = new
                {
                    userId = Session["UserId"]
                };

                return Json(new { Tweets = tweets, loggedInUserId = loggedInUserId }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }
    }
}