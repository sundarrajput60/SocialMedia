//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace TwitterWeb.Models
{
    using System;
    using System.Collections.Generic;
    
    public partial class ForgotPasswordToken
    {
        public int TokenId { get; set; }
        public string TokenString { get; set; }
        public Nullable<System.DateTime> TokenTime { get; set; }
        public Nullable<int> UserId { get; set; }
    }
}
