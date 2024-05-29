using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace TwitterWeb.Controllers
{
    public class SignUpController : Controller
    {
        // GET: SignUp
        public ActionResult Index()
        {
            if (Session["UserId"] != null)
            {
                Session.Clear();
                Session.Abandon();
            }
            return View();
        }
    }
}