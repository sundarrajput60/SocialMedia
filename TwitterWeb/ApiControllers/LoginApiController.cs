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

        [HttpPost]
        [Route("CheckUser")]
        public IHttpActionResult CheckUser([FromBody]User LoginObj)
        {
            var result = db.Database.SqlQuery<int>("EXEC CheckUser @UserName, @UserPassword",
                                        new SqlParameter("UserName", LoginObj.UserName),
                                        new SqlParameter("UserPassword", LoginObj.UserPassword))
                                   .FirstOrDefault();

            if (result >= 1)
            {
                return Ok(result);
            }
            else if (result == 0)
            {
                return BadRequest();
            }
            else
            {
                return InternalServerError();
            }
        }
    }
}

