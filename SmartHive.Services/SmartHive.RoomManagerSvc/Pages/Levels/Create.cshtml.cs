using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using SmartHive.Common.Data;
using SmartHive.RoomManagerSvc.Data;

namespace SmartHive.RoomManagerSvc.Pages.Levels
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
        ViewData["OfficeId"] = new SelectList(_context.Office, "OfficeId", "OfficeAddress");
            return Page();
        }

        [BindProperty]
        public Level Level { get; set; }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            _context.Level.Add(Level);
            await _context.SaveChangesAsync();

            return RedirectToPage("./Index");
        }
    }
}