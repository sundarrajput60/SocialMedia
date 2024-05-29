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
    
    public partial class UsersTweet
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public UsersTweet()
        {
            this.LikeTweets = new HashSet<LikeTweet>();
            this.CommentTweets = new HashSet<CommentTweet>();
            this.UserNotifications = new HashSet<UserNotification>();
        }
    
        public int TweetId { get; set; }
        public string TweetText { get; set; }
        public string TweetImg { get; set; }
        public Nullable<System.DateTime> TweetPostedTime { get; set; }
        public Nullable<int> UserId { get; set; }
        public Nullable<bool> IsDeleted { get; set; }
        public Nullable<int> LikeCount { get; set; }
        public Nullable<int> CommentCount { get; set; }
    
        public virtual User User { get; set; }
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<LikeTweet> LikeTweets { get; set; }
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<CommentTweet> CommentTweets { get; set; }
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<UserNotification> UserNotifications { get; set; }
    }
}