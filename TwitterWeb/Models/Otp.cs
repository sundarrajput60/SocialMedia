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
    
    public partial class Otp
    {
        public int OtpId { get; set; }
        public Nullable<int> OtpNumber { get; set; }
        public Nullable<int> UserId { get; set; }
        public Nullable<System.DateTime> OtpDate { get; set; }
    
        public virtual User User { get; set; }
    }
}
