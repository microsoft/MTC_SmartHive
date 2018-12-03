using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using SmartHive.Common.Data;
using SmartHive.RoomManagerSvc.Data;

namespace SmartHive.RoomManagerSvc.Pages.Sensors
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
        ViewData["DeviceId"] = new SelectList(_context.Device, "DeviceId", "DeviceId");
        ViewData["RoomId"] = new SelectList(_context.Room, "RoomId", "ExchangeName");
        ViewData["Telemetry"] = new SelectList(_context.Telemetry, "Telemetry1", "Telemetry1");
            return Page();
        }

        [BindProperty]
        public Sensor Sensor { get; set; }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            _context.Sensor.Add(Sensor);
            await _context.SaveChangesAsync();

            return RedirectToPage("./Index");
        }
    }
}