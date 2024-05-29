using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using TwitterWeb.Models;

namespace TwitterWeb.ApiControllers
{
    [RoutePrefix("api/SignUpApi")]
    public class SignUpApiController : ApiController
    {
        DBContext db = new DBContext();

        [HttpPost]
        [Route("AddUser")]
        public IHttpActionResult AddUser(User data)
        {
            var ProfilePic = "/Images/DefaultProfile.png";
            var ProfileBgPic = "/Images/DefaultProfileBg.png";
            try
            {
                var result = db.Database.ExecuteSqlCommand("EXEC AddUsers @UserName, @UserEmail, @UserPassword, @ProfilePic, @ProfileBgPic",
                                             new SqlParameter("UserName", data.UserName),
                                             new SqlParameter("UserEmail", data.UserEmail),
                                             new SqlParameter("UserPassword", data.UserPassword),
                                             new SqlParameter("ProfilePic", ProfilePic),
                                             new SqlParameter("ProfileBgPic", ProfileBgPic));

                if (result >= 1)
                {
                    return Ok(result);
                }
                else
                {
                    return InternalServerError();
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}
