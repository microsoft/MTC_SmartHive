using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using SmartHive.Common.Data;
using SmartHive.RoomManagerSvc.Data;

namespace SmartHive.RoomManagerSvc.Pages.Rooms
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
        ViewData["LevelId"] = new SelectList(_context.Level, "LevelId", "LevelCode");
        ViewData["TopicId"] = new SelectList(_context.ServiceBusTopic, "TopicId", "Namespace");
            return Page();
        }

        [BindProperty]
        public Room Room { get; set; }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            _context.Room.Add(Room);
            await _context.SaveChangesAsync();

            return RedirectToPage("./Index");
        }
    }
}