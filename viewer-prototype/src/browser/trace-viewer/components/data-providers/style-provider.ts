import { TspClient } from 'tsp-typescript-client/lib/protocol/tsp-client';

export class StyleProvider {
    // private tspClient: TspClient;
    // private traceId: string;
    private outputId: string;

    private tmpStyleObject: { [key: string]: { [key: string]: { [key: string]: any } } };

    private styles: { [key: string]: { [key: string]: any } } | undefined;

    constructor(outputId: string, traceId: string, tspClient: TspClient) {
        this.outputId = outputId;
        // this.tspClient = tspClient;
        // this.traceId = traceId;
        const threadStyleObject = {
            '0': {
                color: '646464',
                height: 0.33
            },
            '2': {
                color: '00C800',
                height: 1
            },
            '3': {
                color: '0000C8',
                height: 1
            },
            '4': {
                color: 'C80064',
                height: 0.75
            },
            '1': {
                color: 'C8C800',
                height: 0.5
            },
            '5': {
                color: 'C86400',
                height: 0.5
            },
            '6': {
                color: 'C8C8C8',
                height: 0.5
            }
        };

        const resourceStyleObject = {
            '0': {
                color: 'C8C8C8',
                height: 0.66
            },
            '2': {
                color: '00C800',
                height: 1
            },
            '4': {
                color: '0000C8',
                height: 1
            },
            '16': {
                color: 'C80064',
                height: 0.75
            },
            '8': {
                color: 'C89664',
                height: 1
            },
            '1': {
                color: 'C8C800',
                height: 1
            }
        };

        const flameStyleObject = {
          '0': {
              color: '646464',
              height: 0.33
          },
          '2': {
              color: '00C800',
              height: 1
          },
          '3': {
              color: '0000C8',
              height: 1
          },
          '4': {
              color: 'C80064',
              height: 0.75
          },
          '1': {
              color: 'C8C800',
              height: 0.5
          },
          '5': {
              color: 'C86400',
              height: 0.5
          },
          '6': {
              color: 'C8C8C8',
              height: 0.5
          },
            '100': {
                color: '99573D',
                height: 0.75
            },
            '101': {
                color: '99723D',
                height: 0.75
            },
            '102': {
                color: '998C3D',
                height: 0.75
            },
            '103': {
                color: '8C993D',
                height: 0.75
            },
            '104': {
                color: '72993D',
                height: 0.75
            },
            '105': {
                color: '57993D',
                height: 0.75
            },
            '106': {
                color: '3D993D',
                height: 0.75
            },
            '107': {
                color: '3D9957',
                height: 0.75
            },
            '108': {
                color: '3D9972',
                height: 0.75
            },
            '109': {
                color: '3D998C',
                height: 0.75
            },
            '110': {
                color: '3D8C99',
                height: 0.75
            },
            '111': {
                color: '3D7299',
                height: 0.75
            },
            '112': {
                color: '3D5799',
                height: 0.75
            },
            '113': {
                color: '3D3D99',
                height: 0.75
            },
            '114': {
                color: '573D99',
                height: 0.75
            },
            '115': {
                color: '723D99',
                height: 0.75
            },
            '116': {
                color: '8C3D99',
                height: 0.75
            },
            '117': {
                color: '993D8C',
                height: 0.75
            },
            '118': {
                color: '993D72',
                height: 0.75
            },
            '119': {
                color: '993D57',
                height: 0.75
            }
        };

        this.tmpStyleObject = {
            'org.eclipse.tracecompass.internal.analysis.os.linux.core.threadstatus.ThreadStatusDataProvider': threadStyleObject,
            'org.eclipse.tracecompass.internal.analysis.os.linux.core.threadstatus.ResourcesStatusDataProvider': resourceStyleObject,
            'org.eclipse.tracecompass.incubator.internal.callstack.core.instrumented.provider.flamechart:org.eclipse.tracecompass.incubator.uftrace.analysis.callstack': flameStyleObject
        };
    }

    /**
     * Get the style for a specific output
     * @param forceUpdate Force the update of the current cached styles from the server
     */
    public getStyles(forceUpdate?: boolean): { [key: string]: { [key: string]: any } } {
        if (!this.styles || forceUpdate) {
            // Fetch from the server
            // TODO No style yet in the server
            // const styleResponse = await this.tspClient.fetchTimeGraphToolTip(this.traceId, this.outputId, 0);
            // this.styles = styleResponse.getModel().model
            let providerId = this.outputId;
            const index = providerId.indexOf(':');
            if (index > 0) {
              providerId = providerId.substring(0, index);
            }
            console.log(providerId); 
            const styles = this.tmpStyleObject[this.outputId];
            this.styles = styles ? styles : {};
        }
        return this.styles;
    }
}
