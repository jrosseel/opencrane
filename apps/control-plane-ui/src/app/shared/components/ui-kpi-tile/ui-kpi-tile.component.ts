import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { ProgressBarModule } from "primeng/progressbar";

/** Reusable KPI tile used across dashboard pages. */
@Component({
  selector: "oc-ui-kpi-tile",
  standalone: true,
  imports: [CommonModule, ProgressBarModule],
  templateUrl: "./ui-kpi-tile.component.html",
  styleUrl: "./ui-kpi-tile.component.css",
})
export class UiKpiTileComponent
{
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string;
  @Input() progress?: number;
}
