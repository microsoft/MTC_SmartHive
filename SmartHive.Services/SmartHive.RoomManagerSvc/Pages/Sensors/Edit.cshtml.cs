using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using SmartHive.Common.Data;
using SmartHive.RoomManagerSvc.Data;

namespace SmartHive.RoomManagerSvc.Pages.Sensors
{
    public class EditModel : PageModel
    {
        private readonly SmartHive.RoomManagerSvc.Data.SmartHiveContext _context;

        public EditModel(SmartHive.RoomManagerSvc.Data.SmartHiveContext context)
        {
            _context = context;
        }

        [BindProperty]
        public Sensor Sensor { get; set; }

        public async Task<IActionResult> OnGetAsync(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            Sensor = await _context.Sensor
                .Include(s => s.Device)
                .Include(s => s.Room)
                .Include(s => s.TelemetryNavigation).FirstOrDefaultAsync(m => m.Id == id);

            if (Sensor == null)
            {
                return NotFound();
            }
           ViewData["DeviceId"] = new SelectList(_context.Device, "DeviceId", "DeviceId");
           ViewData["RoomId"] = new SelectList(_context.Room, "RoomId", "ExchangeName");
           ViewData["Telemetry"] = new SelectList(_context.Telemetry, "Telemetry1", "Telemetry1");
            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid)
            {
                return Page();
            }

            _context.Attach(Sensor).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SensorExists(Sensor.Id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return RedirectToPage("./Index");
        }

        private bool SensorExists(int id)
        {
            return _context.Sensor.Any(e => e.Id == id);
        }
    }
}
