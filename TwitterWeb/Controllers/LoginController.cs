using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Web;
using System.Web.Mvc;
using TwitterWeb.Models;

namespace TwitterWeb.Controllers
{
    public class LoginController : Controller
    {
        string conStr = ConfigurationManager.ConnectionStrings["conn"].ConnectionString;
        // GET: Login
        public ActionResult Index()
        {
            if (Session["UserId"] != null)
            {
                Session.Clear();
                Session.Abandon();
            }
            return View();
        }

        public ActionResult ForgotPasswordMail()
        {
            return View();
        }

        [HttpPost]
        [Route("EmailForForgetPassword")]
        public ActionResult EmailForForgotPassword(string email)
        {
            var UserEmail = "";
            var Id = "";

            using (SqlConnection connection = new SqlConnection(conStr))
            {
                connection.Open();

                using (SqlCommand command = new SqlCommand("CheckEmailForForgetPassword", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@UserEmail", email);

                    using (SqlDataReader reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            Id = reader["UserId"].ToString();
                            var UserId = Convert.ToInt32(Id);
                            UserEmail = reader["UserEmail"].ToString();
                            var resetToken = GenerateToken(UserId);
                            try
                            {
                                using (MailMessage mail = new MailMessage())
                                {
                                    mail.From = new MailAddress("sundarsinh20@gmail.com");
                                    mail.To.Add(UserEmail);
                                    mail.Subject = "Forgot Password";
                                    mail.Body = $"Click the link to reset your password: <a href='https://localhost:44364/Login/ResetPassword?token={resetToken}'>Reset Password</a>";
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
                                Response.Write(e.Message);
                            }
                        }
                        else
                        {
                            return Json(0, JsonRequestBehavior.AllowGet);
                        }
                    }
                }
            }
            return Json("Email found", JsonRequestBehavior.AllowGet);
        }

        private string GenerateToken(int UserId)
        {
            var tokenExpiry = DateTime.Now.AddMinutes(10);
            using (var rng = new RNGCryptoServiceProvider())
            {
                var tokenData = new byte[32];
                rng.GetBytes(tokenData);
                var token = Convert.ToBase64String(tokenData);

                using (SqlConnection connection = new SqlConnection(conStr))
                {
                    connection.Open();
                    using (SqlCommand command = new SqlCommand("CheckInsertToken", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@TokenString", token);
                        command.Parameters.AddWithValue("@UserId", UserId);
                        command.Parameters.AddWithValue("@TokenTime", tokenExpiry);
                        command.ExecuteNonQuery();
                    }
                }
                return token;
            }
        }

        public ActionResult ResetPassword()
        {
            return View();
        }

        public ActionResult ValidateToken(string token)
        {
            using (SqlConnection connection = new SqlConnection(conStr))
            {
                connection.Open();
                using (SqlCommand command = new SqlCommand("ValidateToken", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@TokenString", token);

                    using (SqlDataReader reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return Json(1, JsonRequestBehavior.AllowGet);
                        }
                    }
                }
            }
            return Json(0, JsonRequestBehavior.AllowGet);
        }


        [HttpPost]
        public ActionResult ResetPassword(string token, string newPassword)
        {
            var id = "";
            var userId = 0;

            using (SqlConnection connection = new SqlConnection(conStr))
            {
                connection.Open(); // Open the connection once

                // Step 1: Get the User ID by Token
                using (SqlCommand command = new SqlCommand("GetUserByToken", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@TokenString", token);

                    using (SqlDataReader reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            id = reader["UserId"].ToString();
                            userId = Convert.ToInt32(id);
                        }
                    }
                }

                // Step 2: Reset the User Password if User ID was found
                if (userId != 0)
                {
                    using (SqlCommand command = new SqlCommand("ResetUserPassword", connection))
                    {
                        command.CommandType = CommandType.StoredProcedure;
                        command.Parameters.AddWithValue("@UserId", userId);
                        command.Parameters.AddWithValue("@UserPassword", newPassword);
                        command.Parameters.AddWithValue("@TokenString", token);

                        var result = command.ExecuteScalar();
                        if (result != null && Convert.ToInt32(result) == 1)
                        {
                            return Json(new { success = true });
                        }
                        else
                        {
                            return Json(new { success = false, message = "New password must be different from the last 3 old passwords." });
                        }
                    }
                }
            }

            return Json(new { success = false, message = "Invalid token or other error." });
        }


        public ActionResult Logout()
        {
            Session.Clear();
            Session.Abandon();
            return RedirectToAction("Index","Login");
        }

    }
}