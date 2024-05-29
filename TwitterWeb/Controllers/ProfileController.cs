
using MySqlX.XDevAPI;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Web;
using System.Web.Mvc;
using TwitterWeb.Models;

namespace TwitterWeb.Controllers
{
    [RoutePrefix("Profile")]
    public class ProfileController : Controller
    {
        string conStr = ConfigurationManager.ConnectionStrings["conn"].ConnectionString;
        HttpClient client = new HttpClient();
        DBContext db = new DBContext();

        // GET: Profile
        [HttpGet]
        public ActionResult UserProfile()
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }
            return View();
        }

        [HttpGet]
        [Route("GetProfileData")]
        public ActionResult GetProfileData()
        {
            try
            {
                if (Session["UserId"] == null)
                {
                    return Json("Please, login again", JsonRequestBehavior.AllowGet);
                }
                int id = (int)Session["UserId"];
                User userData = new User();
                System.Net.ServicePointManager.ServerCertificateValidationCallback = (senderX, certificate, chain, sslPolicyErrors) => { return true; };
                client.BaseAddress = new Uri("https://localhost:44364/api/ProfileApi");
                var response = client.GetAsync("ProfileApi/" + id);
                response.Wait();
                var test = response.Result;

                if (test.IsSuccessStatusCode)
                {
                    var display = test.Content.ReadAsAsync<User>();
                    display.Wait();
                    userData = display.Result;
                    return Json(userData, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                // Log the exception for debugging purposes
                Console.WriteLine("Exception: " + ex.Message);
                return Json("Error occurred", JsonRequestBehavior.AllowGet);
            }
            return Json("Not Found", JsonRequestBehavior.AllowGet);
        }

        public ActionResult EditProfile()
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }
            return View();
        }

        [HttpPost]
        [Route("UpdateProfileData")]
        public ActionResult UpdateProfileData(User obj, HttpPostedFileBase ProfilePic, HttpPostedFileBase ProfileBgPic)
        {
            var uid = Session["UserId"];
            try
            {
                using (SqlConnection con = new SqlConnection(conStr))
                {
                    con.Open();
                    SqlCommand cmd = new SqlCommand("UpdateProfileData", con);
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@UserId", uid);
                    cmd.Parameters.AddWithValue("@FirstName", obj.FirstName);
                    cmd.Parameters.AddWithValue("@Gender", obj.Gender);
                    cmd.Parameters.AddWithValue("@UserEmail", obj.UserEmail);
                    cmd.Parameters.AddWithValue("@DateOfBirth", obj.DateOfBirth);
                    cmd.Parameters.AddWithValue("@Country", obj.Country);
                    cmd.Parameters.AddWithValue("@Bio", obj.Bio);
                
                    if (ProfilePic == null)
                    {
                        cmd.Parameters.AddWithValue("@ProfilePicPath", obj.ProfilePic);
                    }
                    else
                    {
                        string profilePicPath = UploadProfilePicture(ProfilePic);
                        cmd.Parameters.AddWithValue("@ProfilePicPath", profilePicPath);
                    }

                    if (ProfileBgPic == null)
                    {
                        cmd.Parameters.AddWithValue("@ProfileBgPicPath", obj.ProfileBgPic);
                    }
                    else
                    {
                        string profileBgPicPath = UploadProfileBackgroundPicture(ProfileBgPic);
                        cmd.Parameters.AddWithValue("@ProfileBgPicPath", profileBgPicPath);
                    }

                    int rowsAffected = cmd.ExecuteNonQuery();
                    con.Close();

                    if (rowsAffected > 0)
                    {
                        return Json("Profile data updated successfully", JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        return Json(rowsAffected, JsonRequestBehavior.AllowGet);
                    }
                }
            }
            catch (Exception ex)
            {
                return Json("Unable to update profile data. Please try again later.", JsonRequestBehavior.AllowGet);
            }
        }

        private string UploadProfilePicture(HttpPostedFileBase profilePic)
        {
            if (profilePic != null && profilePic.ContentLength > 0)
            {
                string imageName = System.IO.Path.GetFileName(profilePic.FileName);
                string physicalPath = Server.MapPath("~/Images/" + imageName);
                profilePic.SaveAs(physicalPath);
                var FinalPath = VirtualPathUtility.ToAbsolute("~/Images/" + imageName);
                return FinalPath;
            }
            return null;
        }

        private string UploadProfileBackgroundPicture(HttpPostedFileBase profileBgPic)
        {
            if (profileBgPic != null && profileBgPic.ContentLength > 0)
            {
                string imageName = System.IO.Path.GetFileName(profileBgPic.FileName);
                string physicalPath = Server.MapPath("~/Images/" + imageName);
                profileBgPic.SaveAs(physicalPath);
                var FinalPath = VirtualPathUtility.ToAbsolute("~/Images/" + imageName);
                return FinalPath;
            }
            return null;
        }

        public ActionResult Tweet()
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }
            return View();
        }

        public ActionResult UserTweet(UsersTweet obj, HttpPostedFileBase TweetImg)
        {
            int UserId = Convert.ToInt32(Session["UserId"]);
            string finalPath = null;

            // Check if TweetImg is not null and process the image upload
            if (TweetImg != null)
            {
                string imageName = System.IO.Path.GetFileName(TweetImg.FileName);
                string physicalPath = Server.MapPath("~/Images/" + imageName);
                TweetImg.SaveAs(physicalPath);
                finalPath = VirtualPathUtility.ToAbsolute("~/Images/" + imageName);
            }

            try
            {
                // Pass the finalPath or null to the stored procedure parameter based on if TweetImg is uploaded or not
                db.Database.ExecuteSqlCommand("EXEC InsertTweet @UserId, @TweetText, @TweetImg",
                                             new SqlParameter("UserId", UserId),
                                             new SqlParameter("TweetText", obj.TweetText),
                                             new SqlParameter("TweetImg", (object)finalPath ?? DBNull.Value));

                return Json("Tweet posted", JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json("Unable to post tweet", JsonRequestBehavior.AllowGet);
            }
        }

        public ActionResult UserFriendReq()
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }
            return View();
        }

        [HttpGet]
        [Route("GetUserFriendReq")]
        public ActionResult GetUserFriendReq()
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }

            var receiverId = (int)Session["UserId"];
            var result = from followUser in db.FollowUsers
                         join user in db.Users
                         on followUser.SenderId equals user.UserId
                         where followUser.ReceiverId == receiverId
                               && followUser.FollowStatus == "pending"
                              
                         select new
                         {
                             followUser.FollowId,
                             followUser.SenderId,
                             followUser.ReceiverId,
                             followUser.IsFriend,
                             followUser.FollowStatus,
                             user.UserId,
                             user.FirstName,
                             user.UserName,
                             user.ProfilePic
                         };
            return Json(result,JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        [Route("AcceptFriendReq")]
        public ActionResult AcceptFriendReq(int senderId)
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }
            try
            {
                var ReceiverId = (int)Session["UserId"];
                db.Database.ExecuteSqlCommand("EXEC AcceptFriendReq @SenderId, @ReceiverId",
                                                 new SqlParameter("SenderId", senderId),
                                                 new SqlParameter("ReceiverId", ReceiverId));
                db.SaveChanges();
                return Json("Request Accepted", JsonRequestBehavior.AllowGet);
            }
            catch
            {

            }
            return Json("Unable to accepted request", JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        [Route("RejectFriendReq")]
        public ActionResult RejectFriendReq(int senderId)
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }
            try
            {
                var ReceiverId = (int)Session["UserId"];
                db.Database.ExecuteSqlCommand("EXEC RejectFriendReq @SenderId, @ReceiverId",
                                                 new SqlParameter("SenderId", senderId),
                                                 new SqlParameter("ReceiverId", ReceiverId));
                db.SaveChanges();
                return Json("Request rejected", JsonRequestBehavior.AllowGet);
            }
            catch
            {

            }
            return Json("Unable to rejected request", JsonRequestBehavior.AllowGet);
        }

        public ActionResult UserFriend()
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }
            return View();
        }

        public ActionResult GetUserFriend()
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }

            var receiverId = (int)Session["UserId"];

            var result = (from followUser in db.FollowUsers
                          join user in db.Users on followUser.ReceiverId equals user.UserId
                          where followUser.SenderId == receiverId && followUser.FollowStatus == "accepted" && followUser.IsFriend == true
                          select new
                          {
                              followUser.FollowId,
                              followUser.SenderId,
                              followUser.ReceiverId,
                              followUser.IsFriend,
                              followUser.FollowStatus,
                              user.UserId,
                              user.FirstName,
                              user.UserName,
                              user.ProfilePic
                          }).Union(
                          from followUser in db.FollowUsers
                          join user in db.Users on followUser.SenderId equals user.UserId
                          where followUser.ReceiverId == receiverId && followUser.FollowStatus == "accepted" && followUser.IsFriend == true
                          select new
                          {
                              followUser.FollowId,
                              followUser.SenderId,
                              followUser.ReceiverId,
                              followUser.IsFriend,
                              followUser.FollowStatus,
                              user.UserId,
                              user.FirstName,
                              user.UserName,
                              user.ProfilePic
                          }).ToList();

            return Json(result, JsonRequestBehavior.AllowGet);
        }


        [HttpPost]
        [Route("RemoveFriend")]
        public ActionResult RemoveFriend(int senderId)
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }
            try
            {
                var ReceiverId = (int)Session["UserId"];
                db.Database.ExecuteSqlCommand("EXEC RemoveFriend @SenderId, @ReceiverId",
                                                 new SqlParameter("SenderId", senderId),
                                                 new SqlParameter("ReceiverId", ReceiverId));
                db.SaveChanges();
                return Json("Request rejected", JsonRequestBehavior.AllowGet);
            }
            catch
            {

            }
            return Json("removed ");
        }
    }
}