import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { IInputs, IOutputs } from './generated/ManifestTypes';
import PDFMergerApp from '../../src/PDFMergerApp';

export class PDFSolutionV4Control implements ComponentFramework.StandardControl<IInputs, IOutputs> {
  private root!: ReactDOM.Root;
  private notifyOutputChanged!: () => void;
  private mergedPdfBase64: string | undefined;

  public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
  ): void {
    this.notifyOutputChanged = notifyOutputChanged;
    this.root = ReactDOM.createRoot(container);
    this.renderControl();
  }

  public updateView(context: ComponentFramework.Context<IInputs>): void {
    this.renderControl();
  }

  private renderControl(): void {
    this.root.render(
      React.createElement(PDFMergerApp, {
        onMergedPdfChange: (base64: string) => {
          this.mergedPdfBase64 = base64;
          this.notifyOutputChanged();
        },
      })
    );
  }

  public getOutputs(): IOutputs {
    return {
      mergedPdfBase64: this.mergedPdfBase64,
    };
  }

  public destroy(): void {
    this.root.unmount();
  }
}
