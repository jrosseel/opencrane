import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { CardModule } from "primeng/card";

/** Reusable section wrapper for feature blocks with a standard heading layout. */
@Component({
  selector: "oc-ui-section-card",
  standalone: true,
  imports: [CommonModule, CardModule],
  templateUrl: "./ui-section-card.component.html",
  styleUrl: "./ui-section-card.component.css",
})
export class UiSectionCardComponent
{
  @Input({ required: true }) title!: string;
  @Input() subtitle = "";
}
