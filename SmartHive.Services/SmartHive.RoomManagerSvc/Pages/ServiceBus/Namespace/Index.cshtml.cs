using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using SmartHive.Common.Data;
using SmartHive.RoomManagerSvc.Data;

namespace SmartHive.RoomManagerSvc.Pages.ServiceBus.Namespace
{
    public class IndexModel : PageModel
    {
        private readonly SmartHive.RoomManagerSvc.Data.SmartHiveContext _context;

        public IndexModel(SmartHive.RoomManagerSvc.Data.SmartHiveContext context)
        {
            _context = context;
        }

        public IList<ServiceBusNamespace> ServiceBusNamespace { get;set; }

        public async Task OnGetAsync()
        {
            ServiceBusNamespace = await _context.ServiceBusNamespace.ToListAsync();
        }
    }
}
