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
    public class DeleteModel : PageModel
    {
        private readonly SmartHive.RoomManagerSvc.Data.SmartHiveContext _context;

        public DeleteModel(SmartHive.RoomManagerSvc.Data.SmartHiveContext context)
        {
            _context = context;
        }

        [BindProperty]
        public ServiceBusNamespace ServiceBusNamespace { get; set; }

        public async Task<IActionResult> OnGetAsync(string id)
        {
            if (id == null)
            {
                return NotFound();
            }

            ServiceBusNamespace = await _context.ServiceBusNamespace.FirstOrDefaultAsync(m => m.Namespace == id);

            if (ServiceBusNamespace == null)
            {
                return NotFound();
            }
            return Page();
        }

        public async Task<IActionResult> OnPostAsync(string id)
        {
            if (id == null)
            {
                return NotFound();
            }

            ServiceBusNamespace = await _context.ServiceBusNamespace.FindAsync(id);

            if (ServiceBusNamespace != null)
            {
                _context.ServiceBusNamespace.Remove(ServiceBusNamespace);
                await _context.SaveChangesAsync();
            }

            return RedirectToPage("./Index");
        }
    }
}
