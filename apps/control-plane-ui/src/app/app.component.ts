import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import type { MenuItem } from "primeng/api";
import { MenubarModule } from "primeng/menubar";

/** Root shell with top navigation and router outlet. */
@Component({
  selector: "oc-root",
  standalone: true,
  imports: [CommonModule, MenubarModule, RouterOutlet],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent
{
  protected readonly navigation: MenuItem[] = [
    { label: "Server Metrics", icon: "pi pi-chart-line", routerLink: "/stats" },
    { label: "Token Usage & Budgets", icon: "pi pi-wallet", routerLink: "/usage" },
    { label: "Access Tokens", icon: "pi pi-key", routerLink: "/tokens" },
    { label: "Provider Keys", icon: "pi pi-shield", routerLink: "/providers" },
  ];
}
