using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Mail;
using System.Web.Http;
using TwitterWeb.Models;

namespace TwitterWeb.ApiControllers
{
    //[RoutePrefix("api/SignUpApi")]
    //public class SignUpApiController : ApiController
    //{
    //    DBContext db = new DBContext();

    //    [HttpPost]
    //    [Route("AddUser")]
    //    public IHttpActionResult AddUser(User data)
    //    {
    //        var ProfilePic = "/Images/DefaultProfile.png";
    //        var ProfileBgPic = "/Images/DefaultProfileBg.png";
    //        try
    //        {
    //            var result = db.Database.SqlQuery<int>("EXEC AddUsers @UserName, @UserEmail, @UserPassword, @ProfilePic, @ProfileBgPic",
    //                                         new SqlParameter("UserName", data.UserName),
    //                                         new SqlParameter("UserEmail", data.UserEmail),
    //                                         new SqlParameter("UserPassword", data.UserPassword),
    //                                         new SqlParameter("ProfilePic", ProfilePic),
    //                                         new SqlParameter("ProfileBgPic", ProfileBgPic)).FirstOrDefault();

    //            return Ok(result);
    //        }
    //        catch (Exception ex)
    //        {
    //            return InternalServerError(ex);
    //        }
    //    }

    //}

    [RoutePrefix("api/SignUpApi")]
    public class SignUpApiController : ApiController
    {
        DBContext db = new DBContext();
        string conStr = ConfigurationManager.ConnectionStrings["conn"].ConnectionString;

        [HttpPost]
        [Route("AddUser")]
        public IHttpActionResult AddUser(User data)
        {
            var ProfilePic = "/Images/DefaultProfile.png";
            var ProfileBgPic = "/Images/DefaultProfileBg.png";
            try
            {
                // Check for existing email
                var existingEmail = db.Users.FirstOrDefault(u => u.UserEmail == data.UserEmail);

                if (existingEmail != null)
                {
                    // Check for existing username
                    var existingUserName = db.Users.FirstOrDefault(u => u.UserName == data.UserName);

                    if (existingUserName != null)
                    {
                        return Ok(3); // Both email and username exist
                    }
                    else
                    {
                        return Ok(2); // Only email exists
                    }
                }
                else
                {
                    // Check for existing username
                    var existingUserName = db.Users.FirstOrDefault(u => u.UserName == data.UserName);

                    if (existingUserName != null)
                    {
                        return Ok(1); // Only username exists
                    }
                    else
                    {
                        // Create new user
                        var newUser = new User
                        {
                            UserName = data.UserName,
                            UserEmail = data.UserEmail,
                            UserPassword = data.UserPassword,
                            ProfilePic = ProfilePic,
                            ProfileBgPic = ProfileBgPic,
                            CreatedAt = DateTime.Now,
                            IsVerified = false
                        };

                        db.Users.Add(newUser);
                        db.SaveChanges();

                        int UserId = newUser.UserId;

                        using (SqlConnection connection = new SqlConnection(conStr))
                        {
                            connection.Open();
                            using (SqlCommand command = new SqlCommand("EXEC UserPassHistory @UserId, @UserPass", connection))
                            {
                                command.Parameters.AddWithValue("@UserId", UserId);
                                command.Parameters.AddWithValue("@UserPass", data.UserPassword);
                                command.ExecuteNonQuery();
                            }
                        }

                        // Generate OTP and send email
                        var otp = GenerateOtp(newUser.UserId);
                        SendOtpEmail(data.UserEmail, otp);

                        return Ok(new { success = 0,newUser = newUser }); // User successfully added
                    }
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

        private int GenerateOtp(int userId)
        {
            var otpNumber = new Random().Next(1000, 9999); 
            var otpExpiry = DateTime.Now.AddMinutes(10);

            using (SqlConnection connection = new SqlConnection(conStr))
            {
                connection.Open();
                using (SqlCommand command = new SqlCommand("EXEC GenerateOtp @OtpNumber, @UserId, @OtpDate", connection))
                {
                    command.Parameters.AddWithValue("@OtpNumber", otpNumber);
                    command.Parameters.AddWithValue("@UserId", userId);
                    command.Parameters.AddWithValue("@OtpDate", otpExpiry);
                    command.ExecuteNonQuery();
                }
            }

            return otpNumber;
        }

        private void SendOtpEmail(string userEmail, int otpNumber)
        {
            try
            {
                using (MailMessage mail = new MailMessage())
                {
                    mail.From = new MailAddress("sundarsinh20@gmail.com");
                    mail.To.Add(userEmail);
                    mail.Subject = "Your OTP Code";
                    mail.Body = $"Your OTP code is {otpNumber}. It will expire in 10 minutes.";
                    mail.IsBodyHtml = true;

                    using (SmtpClient smtp = new SmtpClient("smtp.gmail.com", 587))
                    {
                        smtp.Credentials = new System.Net.NetworkCredential("sundarsinh20@gmail.com", "sywsvunkeuscnrkp");
                        smtp.EnableSsl = true;
                        smtp.Send(mail);
                    }
                }
            }
            catch (Exception e)
            {
                
            }
        }

        [HttpPost]
        [Route("VerifyOtp")]
        public IHttpActionResult VerifyOtp(Otp otpObj)
        {
            using (SqlConnection connection = new SqlConnection(conStr))
            {
                connection.Open();
                using (SqlCommand command = new SqlCommand("VerifyOtp", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@UserId", (int)otpObj.UserId);
                    command.Parameters.AddWithValue("@OtpNumber", (int)otpObj.OtpNumber);

                    var result = command.ExecuteScalar();
                    return Ok(result);
                }
            }
        }

        [HttpGet]
        [Route("ResendOtp")]
        public IHttpActionResult ResendOtp(int userId)
        {
            var otp = GenerateOtp(userId);

            var result = db.Users.Find(userId);
            SendOtpEmail(result.UserEmail, otp);
            return Ok(1);
        }


    }
}
