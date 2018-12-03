using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using SmartHive.Common.Data;
using SmartHive.RoomManagerSvc.Data;

namespace SmartHive.RoomManagerSvc.Pages.ServiceBus.Topic
{
    public class CreateModel : PageModel
    {
        private readonly SmartHive.RoomManagerSvc.Data.SmartHiveContext _context;

        public CreateModel(SmartHive.RoomManagerSvc.Data.SmartHiveContext context)
        {
            _context = context;
        }

        public IActionResult OnGet()
        {
        ViewData["Namespace"] = new SelectList(_context.ServiceBusNamespace, "Namespace", "Namespace");
            return Page();
        }

        [BindProperty]
        public ServiceBusTopic ServiceBusTopic { get; set; }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            _context.ServiceBusTopic.Add(ServiceBusTopic);
            await _context.SaveChangesAsync();

            return RedirectToPage("./Index");
        }
    }
}