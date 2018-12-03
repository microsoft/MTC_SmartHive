using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using SmartHive.Common.Data;
using SmartHive.RoomManagerSvc.Data;

namespace SmartHive.RoomManagerSvc.Pages.Levels
{
    public class DetailsModel : PageModel
    {
        private readonly SmartHive.RoomManagerSvc.Data.SmartHiveContext _context;

        public DetailsModel(SmartHive.RoomManagerSvc.Data.SmartHiveContext context)
        {
            _context = context;
        }

        public Level Level { get; set; }

        public async Task<IActionResult> OnGetAsync(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            Level = await _context.Level
                .Include(l => l.Office).FirstOrDefaultAsync(m => m.LevelId == id);

            if (Level == null)
            {
                return NotFound();
            }
            return Page();
        }
    }
}
