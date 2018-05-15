using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Serialization;
using System.Web;

namespace InfoboardSvc.Common.Helpers
{
    [DataContract(Name = "ExchangeCredential", Namespace = "http://InfoboardService.com/ent/esdexchangeservice/entity")]
    public class ExchangeCredential
    {        
        [DataMember(Name = "Domain", IsRequired = true, Order = 3)]
        public string Domain { get; set; }
        [DataMember(Name = "Password", IsRequired = true, Order = 2)]
        public string Password { get; set; }
        [DataMember(Name = "UserName", IsRequired = true, Order = 1)]
        public string UserName { get; set; }
    }
}