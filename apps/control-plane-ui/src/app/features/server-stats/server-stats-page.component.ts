import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, signal } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";

import { ControlPlaneApiService } from "../../core/api/control-plane-api.service";
import type { ServerUsageStats } from "../../core/models/control-plane.models";
import { UiKpiTileComponent } from "../../shared/components/ui-kpi-tile/ui-kpi-tile.component";
import { UiSectionCardComponent } from "../../shared/components/ui-section-card/ui-section-card.component";

/** Displays current server resource consumption. */
@Component({
  selector: "oc-server-stats-page",
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule, UiKpiTileComponent, UiSectionCardComponent],
  templateUrl: "./server-stats-page.component.html",
  styleUrl: "./server-stats-page.component.css",
})
export class ServerStatsPageComponent implements OnInit, OnDestroy
{
  protected readonly stats = signal<ServerUsageStats | null>(null);
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string>("");
  private _refreshTimer?: ReturnType<typeof setInterval>;

  constructor(private readonly api: ControlPlaneApiService)
  {
  }

  async ngOnInit(): Promise<void>
  {
    await this.refresh();
    this._refreshTimer = setInterval(async () => { await this.refresh(); }, 30000);
  }

  ngOnDestroy(): void
  {
    if (this._refreshTimer)
    {
      clearInterval(this._refreshTimer);
    }
  }

  protected async refresh(): Promise<void>
  {
    this.loading.set(true);
    this.error.set("");

    try
    {
      const data = await this.api.getServerUsage();
      this.stats.set(data);
    }
    catch
    {
      this.error.set("Unable to load server metrics.");
    }
    finally
    {
      this.loading.set(false);
    }
  }

  protected memoryUsagePercent(): number
  {
    const value = this.stats();
    if (!value || value.memoryTotalBytes <= 0)
    {
      return 0;
    }

    return Math.min(100, (value.memoryUsedBytes / value.memoryTotalBytes) * 100);
  }

  protected storageUsagePercent(): number
  {
    const value = this.stats();
    if (!value || value.storageTotalBytes <= 0)
    {
      return 0;
    }

    return Math.min(100, (value.storageUsedBytes / value.storageTotalBytes) * 100);
  }

  protected toGiB(bytes: number): string
  {
    const gib = bytes / (1024 * 1024 * 1024);
    return gib.toFixed(2);
  }

  protected sampledAtText(): string
  {
    const value = this.stats();
    if (!value)
    {
      return "";
    }

    return new Date(value.sampledAt).toLocaleString();
  }
}
