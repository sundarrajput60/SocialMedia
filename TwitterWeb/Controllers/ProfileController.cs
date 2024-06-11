
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
        public ActionResult GetProfileData(int? userId)
        {
            try
            {
                if (Session["UserId"] == null)
                {
                    return Json("Please, login again", JsonRequestBehavior.AllowGet);
                }

                int id = userId ?? (int)Session["UserId"];

                User userData = new User();
                System.Net.ServicePointManager.ServerCertificateValidationCallback = (senderX, certificate, chain, sslPolicyErrors) => true;
                client.BaseAddress = new Uri("https://localhost:44364/api/ProfileApi");
                var response = client.GetAsync($"ProfileApi/{id}");
                response.Wait();

                if (response.Result.IsSuccessStatusCode)
                {
                    var display = response.Result.Content.ReadAsAsync<User>();
                    display.Wait();
                    userData = display.Result;
                    return Json(userData, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
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
                    cmd.Parameters.AddWithValue("@UserName", obj.UserName);
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

                    SqlDataReader reader = cmd.ExecuteReader();
                    if (reader.Read())
                    {
                        int overallResult = reader.GetInt32(reader.GetOrdinal("OverallResult"));
                        bool usernameUpdated = reader.GetBoolean(reader.GetOrdinal("UsernameUpdated"));
                        bool emailUpdated = reader.GetBoolean(reader.GetOrdinal("EmailUpdated"));

                        reader.Close();
                        con.Close();

                        var result = new
                        {
                            Message = "Profile data updated successfully",
                            UsernameUpdated = usernameUpdated,
                            EmailUpdated = emailUpdated
                        };

                        return Json(result, JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        return Json("Unexpected error occurred", JsonRequestBehavior.AllowGet);
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
        public ActionResult AcceptFriendReq(int SenderId)
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }
            try
            {
                var ReceiverId = (int)Session["UserId"];
               
                using (SqlConnection connection = new SqlConnection(conStr))
                {
                    connection.Open();
                    using (SqlCommand command = new SqlCommand("AcceptFriendReq", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@SenderId", SenderId);
                        command.Parameters.AddWithValue("@ReceiverId", ReceiverId);
                        command.ExecuteNonQuery();
                    }
                    InsertAccepteFriendNotification(SenderId, ReceiverId);
                    return Json("Request Accepted", JsonRequestBehavior.AllowGet);
                }
            }
            catch
            {

            }
            return Json("Unable to accepted request", JsonRequestBehavior.AllowGet);
        }

        //Accept friend request notification
        public void InsertAccepteFriendNotification(int SenderId, int ReceiverId)
        {
            using (SqlConnection connection = new SqlConnection(conStr))
            {
                connection.Open();
                using (SqlCommand command = new SqlCommand("AcceptFriendReqNoification", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@SenderId", SenderId);
                    command.Parameters.AddWithValue("@ReceiverId", ReceiverId);
                    command.ExecuteNonQuery();
                }
            }
        }

        [HttpPost]
        [Route("RejectFriendReq")]
        public ActionResult RejectFriendReq(int SenderId)
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }
            try
            {
                var ReceiverId = (int)Session["UserId"];
               
                using (SqlConnection connection = new SqlConnection(conStr))
                {
                    connection.Open();
                    using (SqlCommand command = new SqlCommand("RejectFriendReq", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@SenderId", SenderId);
                        command.Parameters.AddWithValue("@ReceiverId", ReceiverId);
                        command.ExecuteNonQuery();
                    }
                    RejectFriendNotification(SenderId, ReceiverId);
                    return Json("Request rejected", JsonRequestBehavior.AllowGet);
                }
            }
            catch
            {

            }
            return Json("Unable to rejected request", JsonRequestBehavior.AllowGet);
        }
        //Reject friend request notification
        public void RejectFriendNotification(int SenderId, int ReceiverId)
        {
            using (SqlConnection connection = new SqlConnection(conStr))
            {
                connection.Open();
                using (SqlCommand command = new SqlCommand("RejectFriendReqNotification", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@SenderId", SenderId);
                    command.Parameters.AddWithValue("@ReceiverId", ReceiverId);
                    command.ExecuteNonQuery();
                }
            }
        }

        public ActionResult UserFriend()
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }
            return View();
        }

        public ActionResult GetUserFriend(int? userId)
        {
            if (Session["UserId"] == null && userId == null)
            {
                return RedirectToAction("Index", "Login");
            }
            int receiverId = userId ?? (int)Session["UserId"];
            //var receiverId = (int)Session["UserId"];

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
            if(result.Count == 0)
            {
                return Json(result, JsonRequestBehavior.AllowGet);
            }
            return Json(result, JsonRequestBehavior.AllowGet);
        }


        [HttpPost]
        [Route("RemoveFriend")]
        public ActionResult RemoveFriend(int senderId, int receiverId)
        {
            if (Session["UserId"] == null)
            {
                return RedirectToAction("Index", "Login");
            }
            try
            {
                using (SqlConnection connection = new SqlConnection(conStr))
                {
                    connection.Open();
                    using (SqlCommand command = new SqlCommand("RemoveFriend", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@SenderId", senderId);
                        command.Parameters.AddWithValue("@ReceiverId", receiverId);
                        command.ExecuteNonQuery();
                    }
                }
                RemoveFriendNotification(senderId, receiverId);
                return Json("Request rejected", JsonRequestBehavior.AllowGet);
            }
            catch
            {

            }
            return Json("removed ");
        }

        public void RemoveFriendNotification(int senderId, int receiverId)
        {
            using (SqlConnection connection = new SqlConnection(conStr))
            {
                connection.Open();
                using (SqlCommand command = new SqlCommand("RemoveFriendNotification", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@SenderId", senderId);
                    command.Parameters.AddWithValue("@ReceiverId", receiverId);
                    command.ExecuteNonQuery();
                }
            }
        }


        [HttpPost]
        [Route("ProfileChangePassword")]
        public ActionResult ProfileChangePassword(string oldPassword, string newPassword)
        {
            var UserId = (int)Session["UserId"];
            using (SqlConnection connection = new SqlConnection(conStr))
            {
                connection.Open();
                using (SqlCommand command = new SqlCommand("ChangePassword", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@UserId", UserId);
                    command.Parameters.AddWithValue("@NewPassword", newPassword);
                    command.Parameters.AddWithValue("@OldPassword", oldPassword);

                    var result = command.ExecuteScalar();
                    if (result != null && Convert.ToInt32(result) == 1)
                    {
                        return Json(new { success = true });
                    }
                    else if(Convert.ToInt32(result) == 2 )
                    {
                        return Json(2,JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        return Json(new { success = false, message = "New password must be different from the last 3 old passwords." });
                    }
                }
            }
            //return Json("Password Updated", JsonRequestBehavior.AllowGet);
        }
    }
}