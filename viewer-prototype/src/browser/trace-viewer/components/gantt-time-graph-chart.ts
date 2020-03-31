import { TimeGraphChart, TimeGraphChartProviders } from "timeline-chart/lib/layer/time-graph-chart";
import { TimeGraphRowController } from "timeline-chart/lib/time-graph-row-controller";
import { TimelineChart } from "timeline-chart/lib/time-graph-model";
import {Node} from 'react-virtualized-tree';
import { getFlatTree } from "./utils/virtual-tree-component";
/**
 * Time graph that use a tree and this is it's chart component.
 */
export class ganttTimeGraphChart extends TimeGraphChart {
    protected everyRows : TimelineChart.TimeGraphRowModel[];

    constructor(id: string,
        protected providers: TimeGraphChartProviders,
        protected rowController: TimeGraphRowController) {
        super(id, providers, rowController);
        this.everyRows = [];
    }

    protected buildEmtpyRow = (id: number, name: string) => {
        const emptyRow: TimelineChart.TimeGraphRowModel = {
            id: id,
            name: name,
            range: this.providedRange,
            states: [{
                id: ""+id,
                range: this.providedRange,
                label: "empty row",
            }],
        };
        return emptyRow;
    }

    setRowModel(rows: TimelineChart.TimeGraphRowModel[]) {
        if(rows > this.everyRows) {
            this.everyRows = rows
        }
        super.setRowModel(rows);
    }

    protected nodesToTree = (nodes: Node[]) => {
        let rows: TimelineChart.TimeGraphRowModel[] = [];
        getFlatTree(nodes).forEach(({id: nodeId, name: nodeName}:Node) => {
            const row = this.everyRows.find(({id: rowId}:TimelineChart.TimeGraphRowModel) => rowId === +nodeId);
            if(row){
                rows.push(row);
            } else {
                rows.push(this.buildEmtpyRow(+nodeId, nodeName))
            }
        });
        return rows;
    }

    syncTreeAndChart(nodes: Node[]) {
        const rows: TimelineChart.TimeGraphRowModel[] = this.nodesToTree(nodes);
        this.setRowModel(rows);
        this.removeChildren();
        this.addRows(this.rows, this.rowController.rowHeight);
        this.update()
    }
}