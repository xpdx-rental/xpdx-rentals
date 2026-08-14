"use server";

import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import type { VanRow, VanStatusRow } from "@/lib/data/rows";

export async function bulkUploadVans(formData: FormData) {
  try {
    await requireAdmin();

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const text = await file.text();

    return new Promise((resolve) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          if (results.errors.length > 0) {
            resolve({
              success: false,
              error: `CSV Parsing Error: ${results.errors[0].message} on row ${results.errors[0].row}`,
            });
            return;
          }

          const supabase = createAdminClient();
          const rowsToInsert: Partial<VanRow>[] = [];

          for (let i = 0; i < results.data.length; i++) {
            const row = results.data[i] as Record<string, string>;

            // Basic validation
            if (!row.slug || !row.name || !row.body_type || !row.wheelbase_label || !row.roof || !row.transmission || !row.fuel) {
              resolve({
                success: false,
                error: `Row ${i + 1}: Missing required fields. Make sure slug, name, body_type, wheelbase_label, roof, transmission, and fuel are present.`,
              });
              return;
            }

            // Convert string fields to arrays or numbers appropriately
            const features = row.features ? row.features.split(",").map((f: string) => f.trim()) : [];

            rowsToInsert.push({
              slug: row.slug,
              name: row.name,
              make: row.make || null,
              model: row.model || null,
              year: row.year ? parseInt(row.year) : null,
              registration: row.registration || null,
              body_type: row.body_type,
              wheelbase_label: row.wheelbase_label,
              roof: row.roof as "standard" | "high" | "low",
              tonnage: row.tonnage ? parseFloat(row.tonnage) : 0,
              transmission: row.transmission,
              fuel: row.fuel,
              seats: row.seats ? parseInt(row.seats) : null,
              price_weekly_from: row.price_weekly_from ? parseFloat(row.price_weekly_from) : 0,
              price_monthly_from: row.price_monthly_from ? parseFloat(row.price_monthly_from) : null,
              deposit_amount: row.deposit_amount ? parseFloat(row.deposit_amount) : null,
              min_hire_days: row.min_hire_days ? parseInt(row.min_hire_days) : 7,
              length_mm: row.length_mm ? parseInt(row.length_mm) : null,
              height_mm: row.height_mm ? parseInt(row.height_mm) : null,
              width_mm: row.width_mm ? parseInt(row.width_mm) : null,
              wheelbase_mm: row.wheelbase_mm ? parseInt(row.wheelbase_mm) : null,
              load_volume_m3: row.load_volume_m3 ? parseFloat(row.load_volume_m3) : null,
              payload_kg: row.payload_kg ? parseInt(row.payload_kg) : null,
              features: features,
              summary: row.summary || null,
              description: row.description || null,
              seo_title: row.seo_title || null,
              seo_description: row.seo_description || null,
              status: (row.status || "draft") as VanStatusRow,
              price_verified: false,
              dimensions_verified: false,
            });
          }

          if (rowsToInsert.length === 0) {
            resolve({ success: false, error: "The CSV file is empty." });
            return;
          }

          // Insert into database
          const { error } = await supabase.from("vans").insert(rowsToInsert as unknown as VanRow[]);

          if (error) {
            resolve({ success: false, error: `Database Error: ${error.message}` });
            return;
          }

          revalidatePath("/admin/vans");
          revalidatePath("/vans");
          resolve({ success: true, count: rowsToInsert.length });
        },
        error: (error: Error) => {
          resolve({ success: false, error: `CSV Error: ${error.message}` });
        },
      });
    });
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "An unexpected error occurred." };
  }
}
