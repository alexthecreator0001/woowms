import { ArrowLeft, Warehouse, MapTrifold, Stack, GridFour, MapPin, Rows } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function WarehouseGuide() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/warehouse')}
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Warehouse
      </button>

      {/* Hero */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Warehouse size={22} weight="duotone" className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Warehouse Setup Guide</h1>
        </div>
        <p className="text-muted-foreground">
          Learn how to organize your warehouse with zones, aisles, racks, and shelves.
          This guide uses a real-world example to explain each concept.
        </p>
      </div>

      {/* Real World Example */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500/10 to-violet-500/10 px-6 py-4 border-b border-border/40">
          <h2 className="text-lg font-semibold">Think of It Like a Library</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A warehouse is organized just like a library or grocery store.
          </p>
        </div>
        <div className="px-6 py-5 space-y-4 text-sm">
          <div className="flex gap-3">
            <span className="text-xl">🏢</span>
            <div>
              <p className="font-semibold">Warehouse = The Building</p>
              <p className="text-muted-foreground">Your physical warehouse location. Most businesses have one, but you can manage multiple.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">🗂️</span>
            <div>
              <p className="font-semibold">Zone = A Section / Floor</p>
              <p className="text-muted-foreground">Like departments in a store: "Main Storage", "Picking Area", "Receiving Dock". Each zone has a purpose — you pick orders from Picking, receive deliveries in Receiving, etc.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">🛣️</span>
            <div>
              <p className="font-semibold">Aisle = A Row You Walk Down</p>
              <p className="text-muted-foreground">Like supermarket aisles (Aisle A, Aisle B...). Workers walk down aisles to find products. Usually labeled with letters.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">📦</span>
            <div>
              <p className="font-semibold">Rack = A Shelving Unit in the Aisle</p>
              <p className="text-muted-foreground">The actual metal shelving frame. Each aisle has multiple racks (Rack 01, Rack 02...). Think of it as "how far down the aisle" the product is.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">📚</span>
            <div>
              <p className="font-semibold">Shelf = The Level (Height)</p>
              <p className="text-muted-foreground">Each rack has multiple shelf levels. Level 01 is the floor, Level 02 is waist-height, Level 03 is eye-level, etc. Like floors in a building, counted from the ground up.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-xl">📍</span>
            <div>
              <p className="font-semibold">Position = The Exact Spot</p>
              <p className="text-muted-foreground">The specific bin/slot on a shelf, counted left to right. This is where a product actually sits.</p>
            </div>
          </div>
        </div>
      </div>

      {/* The Label System */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 px-6 py-4 border-b border-border/40">
          <h2 className="text-lg font-semibold">The Location Label</h2>
          <p className="mt-1 text-sm text-muted-foreground">Every location gets a unique label so workers know exactly where to go.</p>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Label breakdown */}
          <div className="flex items-center justify-center gap-1 text-lg font-mono font-bold">
            <span className="rounded-lg bg-blue-500/15 px-3 py-1.5 text-blue-700">A</span>
            <span className="text-muted-foreground/40">-</span>
            <span className="rounded-lg bg-violet-500/15 px-3 py-1.5 text-violet-700">02</span>
            <span className="text-muted-foreground/40">-</span>
            <span className="rounded-lg bg-amber-500/15 px-3 py-1.5 text-amber-700">03</span>
            <span className="text-muted-foreground/40">-</span>
            <span className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-emerald-700">01</span>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center text-xs">
            <div>
              <div className="font-semibold text-blue-700">Aisle A</div>
              <div className="text-muted-foreground">Which row</div>
            </div>
            <div>
              <div className="font-semibold text-violet-700">Rack 02</div>
              <div className="text-muted-foreground">Which unit</div>
            </div>
            <div>
              <div className="font-semibold text-amber-700">Shelf 03</div>
              <div className="text-muted-foreground">Which level</div>
            </div>
            <div>
              <div className="font-semibold text-emerald-700">Position 01</div>
              <div className="text-muted-foreground">Which slot</div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            So <span className="font-mono font-semibold text-foreground">A-02-03-01</span> means:
            "Go to <strong>Aisle A</strong>, find the <strong>2nd rack</strong>, look at the <strong>3rd shelf from the floor</strong>, grab from the <strong>1st position on the left</strong>."
          </p>
        </div>
      </div>

      {/* Visual Example - Rack */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 px-6 py-4 border-b border-border/40">
          <h2 className="text-lg font-semibold">What a Rack Looks Like</h2>
          <p className="mt-1 text-sm text-muted-foreground">Here's Aisle A, Rack 01 — a shelving unit with 4 levels and 3 positions.</p>
        </div>
        <div className="px-6 py-5">
          <div className="mx-auto max-w-sm rounded-lg border border-border/40 overflow-hidden bg-muted/10">
            <div className="bg-muted/40 px-3 py-1.5 border-b border-border/30 text-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aisle A — Rack 01</span>
            </div>
            {[4, 3, 2, 1].map((shelf) => (
              <div key={shelf} className={cn('flex items-center border-b border-border/20', shelf === 4 && 'bg-amber-500/5')}>
                <div className="flex w-16 shrink-0 items-center justify-center self-stretch border-r border-border/30 bg-muted/30 py-2.5">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {shelf === 4 ? '👆 Top' : shelf === 1 ? '👇 Floor' : `Level ${String(shelf).padStart(2, '0')}`}
                  </span>
                </div>
                <div className="flex flex-1 gap-0">
                  {[1, 2, 3].map((pos) => (
                    <div key={pos} className="flex h-12 flex-1 items-center justify-center border-r border-border/10 last:border-r-0">
                      <span className="font-mono text-xs font-medium text-muted-foreground">
                        A-01-{String(shelf).padStart(2, '0')}-{String(pos).padStart(2, '0')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {/* Floor */}
            <div className="h-2.5 bg-gradient-to-r from-stone-300/40 via-stone-400/30 to-stone-300/40" />
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            This one rack has <strong>12 locations</strong> (4 shelves × 3 positions).
            A zone with 3 aisles, 5 racks each, 4 shelves, and 3 positions = <strong>180 locations</strong>.
          </p>
        </div>
      </div>

      {/* Zone Types */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-violet-500/10 to-pink-500/10 px-6 py-4 border-b border-border/40">
          <h2 className="text-lg font-semibold">Zone Types Explained</h2>
          <p className="mt-1 text-sm text-muted-foreground">Each zone has a type that describes what happens there.</p>
        </div>
        <div className="divide-y divide-border/30">
          {[
            { type: 'STORAGE', color: 'bg-blue-500', desc: 'Main inventory storage — where most products live on shelves. This is the bulk of your warehouse.', example: '"Main Storage", "Overflow Storage", "Bulk Area"' },
            { type: 'PICKING', color: 'bg-violet-500', desc: 'Where workers grab items to fulfill orders. Usually the most accessible, well-organized area.', example: '"Pick Zone A", "Fast Movers Picking", "Pick Wall"' },
            { type: 'RECEIVING', color: 'bg-amber-500', desc: 'Where incoming deliveries are unloaded and checked in. Temporary staging area near the loading dock.', example: '"Receiving Dock", "Inbound Area"' },
            { type: 'PACKING', color: 'bg-orange-500', desc: 'Where picked items get packed into boxes and labeled for shipping.', example: '"Pack Station 1", "Packing Area"' },
            { type: 'SHIPPING', color: 'bg-emerald-500', desc: 'Packed orders waiting for carrier pickup. Organized by carrier or shipping method.', example: '"FedEx Staging", "Outbound Dock"' },
            { type: 'RETURNS', color: 'bg-red-500', desc: 'Where returned items are inspected, sorted, and either restocked or discarded.', example: '"Returns Processing", "RMA Area"' },
          ].map((z) => (
            <div key={z.type} className="flex items-start gap-3 px-6 py-3.5">
              <div className={cn('mt-0.5 h-3 w-3 shrink-0 rounded-full', z.color)} />
              <div>
                <p className="text-sm font-semibold">{z.type}</p>
                <p className="text-sm text-muted-foreground">{z.desc}</p>
                <p className="mt-0.5 text-xs text-muted-foreground/60">Examples: {z.example}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step by Step */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 px-6 py-4 border-b border-border/40">
          <h2 className="text-lg font-semibold">Quick Start — 3 Steps</h2>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">1</div>
            <div>
              <p className="font-semibold text-sm">Create a Warehouse</p>
              <p className="text-sm text-muted-foreground">Click "+ Warehouse" and give it a name. This is your physical building. Most users need just one.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">2</div>
            <div>
              <p className="font-semibold text-sm">Add Zones</p>
              <p className="text-sm text-muted-foreground">Click "+ Add Zone" inside your warehouse. Start simple: one "Storage" zone and one "Picking" zone is enough for most small operations. You can always add more later.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">3</div>
            <div>
              <p className="font-semibold text-sm">Generate Locations</p>
              <p className="text-sm text-muted-foreground">Click "Generate Locations" in a zone. Set how many aisles, racks, shelves, and positions you have — the system creates all the location labels automatically. Print them and stick them on your shelves!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Typical Small Warehouse */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 px-6 py-4 border-b border-border/40">
          <h2 className="text-lg font-semibold">Example: Small E-Commerce Warehouse</h2>
          <p className="mt-1 text-sm text-muted-foreground">Here's what a typical small operation looks like.</p>
        </div>
        <div className="px-6 py-5">
          <div className="rounded-lg border border-border/40 bg-muted/10 text-sm font-mono">
            <div className="border-b border-border/30 px-4 py-2 font-sans font-semibold text-foreground">
              🏢 Main Warehouse — 123 Industrial Blvd
            </div>
            <div className="space-y-0 divide-y divide-border/20">
              <div className="px-4 py-2.5">
                <div className="flex items-center gap-2 font-sans">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span className="font-semibold">Main Storage</span>
                  <span className="text-xs text-muted-foreground">(STORAGE)</span>
                </div>
                <div className="mt-1 pl-5 text-xs text-muted-foreground font-sans">
                  3 aisles (A-C) × 4 racks × 5 shelves × 3 positions = <strong className="text-foreground">180 locations</strong>
                </div>
                <div className="mt-1 pl-5 text-xs text-muted-foreground">
                  A-01-01-01 → C-04-05-03
                </div>
              </div>
              <div className="px-4 py-2.5">
                <div className="flex items-center gap-2 font-sans">
                  <div className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                  <span className="font-semibold">Pick Area</span>
                  <span className="text-xs text-muted-foreground">(PICKING)</span>
                </div>
                <div className="mt-1 pl-5 text-xs text-muted-foreground font-sans">
                  2 aisles (A-B) × 3 racks × 3 shelves × 4 positions = <strong className="text-foreground">72 locations</strong>
                </div>
                <div className="mt-1 pl-5 text-xs text-muted-foreground">
                  A-01-01-01 → B-03-03-04
                </div>
              </div>
              <div className="px-4 py-2.5">
                <div className="flex items-center gap-2 font-sans">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <span className="font-semibold">Receiving Dock</span>
                  <span className="text-xs text-muted-foreground">(RECEIVING)</span>
                </div>
                <div className="mt-1 pl-5 text-xs text-muted-foreground font-sans">
                  1 aisle × 2 racks × 2 shelves × 4 positions = <strong className="text-foreground">16 locations</strong>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground text-center">
            Total: <strong>268 locations</strong> — enough for a small warehouse with ~500-2,000 SKUs.
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => navigate('/warehouse')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground',
            'hover:bg-primary/90 shadow-sm transition-colors',
          )}
        >
          <Warehouse size={18} weight="duotone" />
          Go Set Up My Warehouse
        </button>
      </div>
    </div>
  );
}
