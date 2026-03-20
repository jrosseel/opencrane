import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";

import { ControlPlaneApiService } from "../../core/api/control-plane-api.service";
import type { AccountBudget, GlobalBudget, UserTokenUsage } from "../../core/models/control-plane.models";
import { UiSectionCardComponent } from "../../shared/components/ui-section-card/ui-section-card.component";

/** Shows token usage and supports global/account budget ceilings. */
@Component({
  selector: "oc-token-usage-page",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputNumberModule, InputTextModule, SelectModule, TableModule, TagModule, UiSectionCardComponent],
  templateUrl: "./token-usage-page.component.html",
  styleUrl: "./token-usage-page.component.css",
})
export class TokenUsagePageComponent implements OnInit
{
  protected readonly usage = signal<UserTokenUsage[]>([]);
  protected readonly accountBudgets = signal<AccountBudget[]>([]);
  protected readonly message = signal<string>("");
  protected readonly currencies = [{ label: "USD", value: "USD" }, { label: "EUR", value: "EUR" }];

  protected readonly globalBudgetForm = new FormGroup({
    currency: new FormControl<"USD" | "EUR">("USD", { nonNullable: true }),
    ceilingAmount: new FormControl<number>(0, { nonNullable: true, validators: [Validators.min(0)] }),
  });

  protected readonly accountBudgetForm = new FormGroup({
    userId: new FormControl<string>("", { nonNullable: true, validators: [Validators.required] }),
    currency: new FormControl<"USD" | "EUR">("USD", { nonNullable: true }),
    ceilingAmount: new FormControl<number>(0, { nonNullable: true, validators: [Validators.min(0)] }),
  });

  constructor(private readonly api: ControlPlaneApiService)
  {
  }

  async ngOnInit(): Promise<void>
  {
    await this.reload();
  }

  protected async saveGlobalBudget(): Promise<void>
  {
    if (this.globalBudgetForm.invalid)
    {
      return;
    }

    await this.api.updateGlobalBudget(this.globalBudgetForm.getRawValue() as GlobalBudget);
    this.message.set("Global budget ceiling updated.");
  }

  protected async saveAccountBudget(): Promise<void>
  {
    if (this.accountBudgetForm.invalid)
    {
      return;
    }

    await this.api.upsertAccountBudget(this.accountBudgetForm.getRawValue() as AccountBudget);
    this.message.set("Per-account budget updated.");
    await this.reloadAccountBudgets();
  }

  protected async deleteAccountBudget(userId: string): Promise<void>
  {
    await this.api.deleteAccountBudget(userId);
    this.message.set(`Deleted budget for ${userId}.`);
    await this.reloadAccountBudgets();
  }

  protected async reload(): Promise<void>
  {
    this.message.set("");

    const usageRows = await this.api.getTokenUsage();
    this.usage.set(usageRows);

    const globalBudget = await this.api.getGlobalBudget();
    this.globalBudgetForm.setValue(globalBudget);

    await this.reloadAccountBudgets();
  }

  private async reloadAccountBudgets(): Promise<void>
  {
    const budgets = await this.api.getAccountBudgets();
    this.accountBudgets.set(budgets);
  }

  protected budgetState(row: UserTokenUsage): "danger" | "success" | "info"
  {
    if (!row.budgetCeiling)
    {
      return "info";
    }

    return row.totalCost > row.budgetCeiling ? "danger" : "success";
  }
}
