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
    [RoutePrefix("ProfileApi")]
    public class ProfileApiController : ApiController
    {
        DBContext db = new DBContext();

        [HttpGet]
        public IHttpActionResult Get(int id)
        {
            var result = db.Database.SqlQuery<User>("EXEC GetUserData @UserId", new SqlParameter("UserId", id)).FirstOrDefault();
            return Ok(result);
        }
    }
}
