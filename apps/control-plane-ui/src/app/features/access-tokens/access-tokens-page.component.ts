import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";

import { ControlPlaneApiService } from "../../core/api/control-plane-api.service";
import type { ControlToken } from "../../core/models/control-plane.models";
import { UiSectionCardComponent } from "../../shared/components/ui-section-card/ui-section-card.component";

/** Manages creation and revocation of access tokens. */
@Component({
  selector: "oc-access-tokens-page",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, TableModule, TagModule, UiSectionCardComponent],
  templateUrl: "./access-tokens-page.component.html",
  styleUrl: "./access-tokens-page.component.css",
})
export class AccessTokensPageComponent implements OnInit
{
  protected readonly tokens = signal<ControlToken[]>([]);
  protected readonly newlyCreatedToken = signal<string>("");
  protected readonly message = signal<string>("");

  protected readonly tokenForm = new FormGroup({
    name: new FormControl<string>("", { nonNullable: true, validators: [Validators.required] }),
    owner: new FormControl<string>("", { nonNullable: true, validators: [Validators.required] }),
    expiresAt: new FormControl<string>("", { nonNullable: true }),
  });

  constructor(private readonly api: ControlPlaneApiService)
  {
  }

  async ngOnInit(): Promise<void>
  {
    await this.reload();
  }

  protected async createToken(): Promise<void>
  {
    if (this.tokenForm.invalid)
    {
      return;
    }

    const payload = this.tokenForm.getRawValue();
    const response = await this.api.createToken({
      name: payload.name,
      owner: payload.owner,
      expiresAt: payload.expiresAt || undefined,
    });

    this.newlyCreatedToken.set(response.plainTextToken);
    this.message.set("Token created. Copy it now, it will not be shown again.");
    this.tokenForm.reset({ name: "", owner: "", expiresAt: "" });
    await this.reload();
  }

  protected async revokeToken(id: string): Promise<void>
  {
    await this.api.deleteToken(id);
    this.message.set("Token deleted.");
    await this.reload();
  }

  private async reload(): Promise<void>
  {
    const list = await this.api.listTokens();
    this.tokens.set(list);
  }
}
