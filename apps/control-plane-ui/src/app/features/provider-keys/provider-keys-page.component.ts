import { CommonModule } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";

import { ControlPlaneApiService } from "../../core/api/control-plane-api.service";
import type { ProviderKeyRecord } from "../../core/models/control-plane.models";
import { UiSectionCardComponent } from "../../shared/components/ui-section-card/ui-section-card.component";

/** Manages global provider API keys for AI services. */
@Component({
  selector: "oc-provider-keys-page",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, TableModule, TagModule, UiSectionCardComponent],
  templateUrl: "./provider-keys-page.component.html",
  styleUrl: "./provider-keys-page.component.css",
})
export class ProviderKeysPageComponent implements OnInit
{
  protected readonly keys = signal<ProviderKeyRecord[]>([]);
  protected readonly message = signal<string>("");

  protected readonly keyForm = new FormGroup({
    openai: new FormControl<string>("", { nonNullable: true, validators: [Validators.required] }),
    claude: new FormControl<string>("", { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(private readonly api: ControlPlaneApiService)
  {
  }

  async ngOnInit(): Promise<void>
  {
    await this.reload();
  }

  protected async saveOpenAi(): Promise<void>
  {
    const value = this.keyForm.controls.openai.value;
    if (!value)
    {
      return;
    }

    await this.api.setProviderKey("openai", value);
    this.keyForm.controls.openai.setValue("");
    this.message.set("OpenAI key updated.");
    await this.reload();
  }

  protected async saveClaude(): Promise<void>
  {
    const value = this.keyForm.controls.claude.value;
    if (!value)
    {
      return;
    }

    await this.api.setProviderKey("claude", value);
    this.keyForm.controls.claude.setValue("");
    this.message.set("Claude key updated.");
    await this.reload();
  }

  protected async deleteProviderKey(provider: "openai" | "claude"): Promise<void>
  {
    await this.api.deleteProviderKey(provider);
    this.message.set(`${provider} key removed.`);
    await this.reload();
  }

  protected configuredState(value: boolean): "success" | "danger"
  {
    return value ? "success" : "danger";
  }

  private async reload(): Promise<void>
  {
    const list = await this.api.listProviderKeys();
    this.keys.set(list);
  }
}
