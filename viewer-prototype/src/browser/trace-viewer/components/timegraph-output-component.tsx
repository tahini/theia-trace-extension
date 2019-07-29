import * as React from 'react';
import { TimeGraphRowElement, TimeGraphRowElementStyle } from "timeline-chart/lib/components/time-graph-row-element";
import { TimeGraphChart, TimeGraphChartProviders } from "timeline-chart/lib/layer/time-graph-chart";
import { TimeGraphChartCursors } from 'timeline-chart/lib/layer/time-graph-chart-cursors';
import { TimeGraphChartGrid } from 'timeline-chart/lib/layer/time-graph-chart-grid';
import { TimeGraphChartSelectionRange } from 'timeline-chart/lib/layer/time-graph-chart-selection-range';
import { TimeGraphVerticalScrollbar } from 'timeline-chart/lib/layer/time-graph-vertical-scrollbar';
import { TimelineChart } from "timeline-chart/lib/time-graph-model";
import { TimeGraphRowController } from "timeline-chart/lib/time-graph-row-controller";
import { EntryHeader } from "tsp-typescript-client/lib/models/entry";
import { QueryHelper } from "tsp-typescript-client/lib/models/query/query-helper";
import { ResponseStatus } from "tsp-typescript-client/lib/models/response/responses";
import { TimeGraphEntry } from "tsp-typescript-client/lib/models/timegraph";
import { SignalManager } from '../../../common/signal-manager';
import { AbstractOutputProps, AbstractOutputState } from "./abstract-output-component";
import { AbstractTreeOutputComponent } from "./abstract-tree-output-component";
import { StyleProvider } from './data-providers/style-provider';
import { TspDataProvider } from './data-providers/tsp-data-provider';
import { ReactTimeGraphContainer } from "./utils/timegraph-container-component";
import Tree, {Node, NodeId, renderers} from 'react-virtualized-tree';
import { isUndefined } from 'util';

const {Expandable} = renderers;

type TimegraphOutputProps = AbstractOutputProps & {
    addWidgetResizeHandler: (handler: () => void) => void;
}

type TimegraohOutputState = AbstractOutputState & {
    nodes: Node[];
}

export class TimegraphOutputComponent extends AbstractTreeOutputComponent<TimegraphOutputProps, TimegraohOutputState> {
    private totalHeight: number = 0;
    private rowController: TimeGraphRowController;
    private chartLayer: TimeGraphChart;
    private vscrollLayer: TimeGraphVerticalScrollbar;
    private horizontalContainer: React.RefObject<HTMLDivElement>;

    private tspDataProvider: TspDataProvider;
    private styleMap = new Map<string, TimeGraphRowElementStyle>();

    private selectedElement: TimeGraphRowElement | undefined;

    constructor(props: TimegraphOutputProps) {
        super(props);
        this.state = {
            outputStatus: ResponseStatus.RUNNING,
            nodes: []
        };
        this.tspDataProvider = new TspDataProvider(this.props.tspClient, this.props.traceId, this.props.outputDescriptor.id);
        this.rowController = new TimeGraphRowController(this.props.style.rowHeight, this.totalHeight);
        this.horizontalContainer = React.createRef();
        const providers: TimeGraphChartProviders = {
            dataProvider: async (range: TimelineChart.TimeGraphRange, resolution: number) => {
                return this.fetchTimegraphData(range, resolution);
            },
            rowElementStyleProvider: (model: TimelineChart.TimeGraphRowElementModel) => {
                return this.getElementStyle(model);
            },
            rowStyleProvider: (row: TimelineChart.TimeGraphRowModel) => {
                return {
                    backgroundColor: 0x979797,// 0xaaaaff,
                    backgroundOpacity: row.selected ? 0.1 : 0,
                    lineColor: 0xdddddd, // hasStates ? 0xdddddd : 0xaa4444, // row.data && row.data.hasStates
                    lineThickness: 1, // hasStates ? 1 : 3 // row.data && row.data.hasStates
                }
            }
        };
        this.chartLayer = new TimeGraphChart('timeGraphChart', providers, this.rowController);
        this.vscrollLayer = new TimeGraphVerticalScrollbar('timeGraphVerticalScrollbar', this.rowController);

        this.chartLayer.onSelectedRowElementChanged((model) => {
            if (model) {
                const el = this.chartLayer.getElementById(model.id);
                if (el) {
                    this.selectedElement = el;
                }
            } else {
                this.selectedElement = undefined;
            }
            this.onElementSelected(this.selectedElement);
        });

        // this.initialize();
    }

    async componentDidMount() {
        const treeParameters = QueryHelper.timeQuery([0, 1]);
        const treeResponse = (await this.props.tspClient.fetchTimeGraphTree<TimeGraphEntry, EntryHeader>(this.props.traceId,
            this.props.outputDescriptor.id, treeParameters)).getModel();
        const nbEntries = treeResponse.model.entries.length;
        this.totalHeight = nbEntries * this.props.style.rowHeight;
        this.rowController.totalHeight = this.totalHeight;
        const nodesEntry = this.treeToNode(treeResponse.model.entries)
        this.setState({
            outputStatus: ResponseStatus.COMPLETED,
            nodes: nodesEntry
        });
    }

    treeToNode = (tree: TimeGraphEntry[])  => {
        let nodes: Node[] = [];
        let rootIds: NodeId[] = [];
        //Create a list of node without children
        tree.forEach(entry => {
            if(entry.parentId === -1){
                rootIds.push(entry.id);
            }
            nodes.push({
                id: entry.id,
                name: entry.labels[0],
                state: {expanded: true,},
            });
        });
        //Add the childrens
        nodes.forEach((node) => {
            let childs: Node[] = [];
            //Assign children to every node
            tree.forEach(childrenEntry => {
                if(childrenEntry.parentId === node.id){
                    let childrenNode = nodes.find(({id}) => id === childrenEntry.id)
                    if(!isUndefined(childrenNode)){
                        childs.push(childrenNode);
                    }
                }
            });
            node.children = childs;
        });
        //Only return root element
        const isRoot = ({id}:Node) => rootIds.includes(id);
        return nodes.filter(isRoot);
    }

    // private async initialize() {
    //     const treeParameters = QueryHelper.timeQuery([0, 1]);
    //     const treeResponse = (await this.props.tspClient.fetchTimeGraphTree<TimeGraphEntry, EntryHeader>(this.props.traceId,
    //         this.props.outputDescriptor.id, treeParameters)).getModel();
    //     const nbEntries = treeResponse.model.entries.length;
    //     this.totalHeight = nbEntries * this.props.style.rowHeight;
    //     this.rowController.totalHeight = this.totalHeight;
    // }

    handleTreeChange = (nodes: Node[]) => {
        this.setState({nodes: nodes});
    }

    renderTree(): React.ReactNode {
        return (
            <Tree nodes={this.state.nodes} onChange={this.handleTreeChange}>
            {({style, node, ...rest}) => (
                <div style={style}>
                    <Expandable node={node} {...rest}>
                        {node.name}
                    </Expandable>
                </div>
            )}
            </Tree>
        );
    }

    renderChart(): React.ReactNode {
        return <div id='timegraph-main' className='ps__child--consume' onWheel={ev => { ev.preventDefault(); ev.stopPropagation(); }} >
            {this.renderTimeGraphContent()}
        </div>;
    }

    private renderTimeGraphContent() {
        return <div id='main-timegraph-content' ref={this.horizontalContainer}>
            {this.getChartContainer()}
        </div>
    }

    private getChartContainer() {
        const grid = new TimeGraphChartGrid('timeGraphGrid', this.props.style.rowHeight, this.props.style.lineColor);

        const cursors = new TimeGraphChartCursors('chart-cursors', this.chartLayer, this.rowController, { color: this.props.style.cursorColor });
        const selectionRange = new TimeGraphChartSelectionRange('chart-selection-range', { color: this.props.style.cursorColor });
        return <ReactTimeGraphContainer
            options={
                {
                    id: 'timegraph-chart',
                    height: this.props.style.height,
                    width: this.props.style.chartWidth, // this.props.style.mainWidth,
                    backgroundColor: this.props.style.chartBackgroundColor,
                    classNames: 'horizontal-canvas'
                }
            }
            onWidgetResize={this.props.addWidgetResizeHandler}
            unitController={this.props.unitController}
            id='timegraph-chart'
            layer={[
                grid, this.chartLayer, selectionRange, cursors
            ]}
        >
        </ReactTimeGraphContainer>;
    }

    protected getVerticalScrollbar() {
        return <ReactTimeGraphContainer
            id='vscroll'
            options={{
                id: 'vscroll',
                width: 10,
                height: this.props.style.height,
                backgroundColor: this.props.style.naviBackgroundColor
            }}
            onWidgetResize={this.props.addWidgetResizeHandler}
            unitController={this.props.unitController}
            layer={[this.vscrollLayer]}
        ></ReactTimeGraphContainer>;
    }

    private async onElementSelected(element: TimeGraphRowElement | undefined) {
        if (element && this.props.viewRange) {
            const elementRange = element.model.range;
            const offset = this.props.viewRange.getOffset()
            const time = (elementRange.start + ((elementRange.end - elementRange.start) / 2)) + (offset ? offset : 0);
            const tooltipResponse = await this.props.tspClient.fetchTimeGraphToolTip(this.props.traceId, this.props.outputDescriptor.id, time, element.row.model.id.toString());
            const responseModel = tooltipResponse.getModel();
            if (responseModel) {
                const tooltipObject = {
                    'Label': element.model.label,
                    'Start time': (elementRange.start + (offset ? offset : 0)).toString(),
                    'End time': (elementRange.end + (offset ? offset : 0)).toString(),
                    ...responseModel.model,
                    'Row': element.row.model.name
                };
                SignalManager.getInstance().fireTooltipSignal(tooltipObject);
            }
        }
    }

    private async fetchTimegraphData(range: TimelineChart.TimeGraphRange, resolution: number) {
        const length = range.end - range.start;
        const overlap = ((length * 5) - length) / 2;
        const start = range.start - overlap > 0 ? range.start - overlap : 0;
        const end = range.end + overlap < this.props.unitController.absoluteRange ? range.end + overlap : this.props.unitController.absoluteRange;
        const newRange: TimelineChart.TimeGraphRange = { start, end };
        const newResolution: number = resolution * 0.8;
        const timeGraphData: TimelineChart.TimeGraphModel = await this.tspDataProvider.getData(newRange, this.props.style.chartWidth);
        if (timeGraphData && this.selectedElement) {
            for (const row of timeGraphData.rows) {
                const selEl = row.states.find(el => !!this.selectedElement && el.id === this.selectedElement.id);
                if (selEl) {
                    selEl.selected = true;
                    break;
                }
            }
        }
        return {
            rows: timeGraphData ? timeGraphData.rows : [],
            range: newRange,
            resolution: newResolution
        };
    }

    private getElementStyle(element: TimelineChart.TimeGraphRowElementModel) {
        const styleProvider = new StyleProvider(this.props.outputDescriptor.id, this.props.traceId, this.props.tspClient);
        const styles = styleProvider.getStyles();
        const backupStyles: TimeGraphRowElementStyle[] = [
            {
                color: 0x3891A6,
                height: this.props.style.rowHeight * 0.8
            }, {
                color: 0x4C5B5C,
                height: this.props.style.rowHeight * 0.7
            }, {
                color: 0xFDE74C,
                height: this.props.style.rowHeight * 0.6
            }, {
                color: 0xDB5461,
                height: this.props.style.rowHeight * 0.5
            }, {
                color: 0xE3655B,
                height: this.props.style.rowHeight * 0.4
            }, {
                color: 0xEA8F87,
                height: this.props.style.rowHeight * 0.9
            }, {
                color: 0xDE636F,
                height: this.props.style.rowHeight * 0.3
            },
        ];

        let style: TimeGraphRowElementStyle | undefined = backupStyles[0];
        const val = element.label;
        const modelData = element.data;
        if (modelData) {
            const value = modelData.stateValue;
            const elementStyle = styles[value.toString()];
            if (elementStyle) {
                return {
                    color: parseInt(elementStyle.color, 16),
                    height: this.props.style.rowHeight * elementStyle.height,
                    borderWidth: element.selected ? 2 : 0,
                    borderColor: 0xeef20c
                };
            }

            if (value === -1) {
                return {
                    color: 0xCACACA,
                    height: this.props.style.rowHeight * 0.5,
                    borderWidth: element.selected ? 2 : 0,
                    borderColor: 0xeef20c
                };
            }
            style = this.styleMap.get(value);
            if (!style) {
                style = backupStyles[(value % backupStyles.length)];
                this.styleMap.set(value, style);
            }
            return {
                color: style.color,
                height: style.height,
                borderWidth: element.selected ? 2 : 0,
                borderColor: 0xeef20c
            };
        }

        style = this.styleMap.get(val);
        if (!style) {
            style = backupStyles[(this.styleMap.size % backupStyles.length)];
            this.styleMap.set(val, style);
        }
        return {
            color: style.color,
            height: style.height,
            borderWidth: element.selected ? 2 : 0,
            borderColor: 0xeef20c
        };
    }

}