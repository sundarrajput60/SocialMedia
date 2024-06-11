using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using TwitterWeb.Models;

namespace TwitterWeb.ApiControllers
{
    [RoutePrefix("api/LoginApi")]
    public class LoginApiController : ApiController
    {
        DBContext db = new DBContext();

        //[HttpPost]
        //[Route("CheckUser")]
        //public IHttpActionResult CheckUser([FromBody] User LoginObj)
        //{
        //    var result = db.Database.SqlQuery<int>("EXEC CheckUser @UserName, @UserPassword",
        //                                new SqlParameter("UserName", LoginObj.UserName),
        //                                new SqlParameter("UserPassword", LoginObj.UserPassword))
        //                           .FirstOrDefault();


        //    return Ok(result);

        //}
        [HttpPost]
        [Route("CheckUser")]
        public IHttpActionResult CheckUser([FromBody] User LoginObj)
        {
            try
            {
                var user = db.Users
                             .Where(u => (u.UserName == LoginObj.UserName || u.UserEmail == LoginObj.UserName)
                                         && u.UserPassword == LoginObj.UserPassword)
                             .Select(u => new { u.UserId, u.IsVerified })
                             .FirstOrDefault();

                if (user == null)
                {
                    return Ok(new { IsVerified = 3, UserId = (int?)null }); // User not found
                }

                int isVerified = (bool)user.IsVerified ? 1 : 2; // 1: user found and verified, 2: user found but not verified

                return Ok(new { IsVerified = isVerified, UserId = user.UserId });
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }

    }
}

