import uuid
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional, Set, Tuple

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.connection import get_db_connection
from app.db.init_db import create_tables
from app.routes.add_route import router as add_route_router
from app.routes.add_station import router as add_station_router
from app.routes.add_stop import router as add_stop_router
from app.routes.add_train import router as add_train_router
from app.routes.calculate_fare import router as calculate_fare_router
from app.routes.delete_route import router as delete_route_router
from app.routes.delete_station import router as delete_station_router
from app.routes.delete_stop import router as delete_stop_router
from app.routes.delete_train import router as delete_train_router
from app.routes.delete_user import router as delete_user_router
from app.routes.get_dashboard_metrics import router as get_dashboard_metrics_router
from app.routes.get_routes import router as get_routes_router
from app.routes.get_routes_by_route_id import router as get_routes_by_route_id_router
from app.routes.get_stations import router as get_stations_router
from app.routes.get_stations_tickets import router as get_stations_tickets_router
from app.routes.get_trains import router as get_trains_router
from app.routes.get_user_history import router as get_user_history_router
from app.routes.get_users import router as get_users_router
from app.routes.get_users_by_user_id import router as get_users_by_user_id_router
from app.routes.signin import router as signin_router
from app.routes.signup import router as signup_router
from app.routes.update_fare import router as update_fare_router
from app.routes.update_route import router as update_route_router
from app.routes.update_station import router as update_station_router
from app.routes.update_stop import router as update_stop_router
from app.routes.update_train import router as update_train_router
from app.routes.update_user import router as update_user_router
from app.utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up... Connecting to the database.")
    connection = await get_db_connection()

    try:
        logger.info("Creating tables...")
        await build_graph()
        # await create_tables(connection)
    finally:
        await connection.close()
        logger.info("Database connection closed")

    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(get_users_router, prefix="", tags=["Users"])
app.include_router(get_stations_router, prefix="", tags=["Stations"])
app.include_router(get_stations_tickets_router, prefix="", tags=["Stations", "Tickets"])
app.include_router(get_routes_router, prefix="", tags=["Routes"])
app.include_router(get_routes_by_route_id_router, prefix="", tags=["Routes"])
app.include_router(get_trains_router, prefix="", tags=["Trains"])
app.include_router(signup_router, prefix="", tags=["Users"])
app.include_router(signin_router, prefix="", tags=["Users"])
app.include_router(add_station_router, prefix="", tags=["Stations"])
app.include_router(add_stop_router, prefix="", tags=["Routes", "Stations"])
app.include_router(add_route_router, prefix="", tags=["Routes"])
app.include_router(add_train_router, prefix="", tags=["Trains"])
app.include_router(get_users_by_user_id_router, prefix="", tags=["Users"])
app.include_router(update_user_router, prefix="", tags=["Users"])
app.include_router(get_user_history_router, prefix="", tags=["Users"])
app.include_router(calculate_fare_router, prefix="", tags=["Tickets"])
app.include_router(update_fare_router, prefix="", tags=["Tickets"])
app.include_router(get_dashboard_metrics_router, prefix="", tags=["Dashboard"])
app.include_router(update_route_router, prefix="", tags=["Routes"])
app.include_router(delete_route_router, prefix="", tags=["Routes"])
app.include_router(update_stop_router, prefix="", tags=["Routes"])
app.include_router(delete_stop_router, prefix="", tags=["Routes"])
app.include_router(delete_user_router, prefix="", tags=["Users"])
app.include_router(update_station_router, prefix="", tags=["Stations"])
app.include_router(delete_station_router, prefix="", tags=["Stations"])
app.include_router(update_train_router, prefix="", tags=["Trains"])
app.include_router(delete_train_router, prefix="", tags={"Trains"})


@app.get("/")
async def root():
    return {"message": "Metro System API is up and running!"}


@app.get("/test-db")
async def test_db():
    try:
        conn = await get_db_connection()
        try:
            result = await conn.fetch("SELECT NOW() as current_time")
            return {"status": "success", "data": result}
        finally:
            await conn.close()
    except Exception as e:
        return {"status": "error", "message": str(e)}


class WeightedGraph:
    """
    A weighted graph implementation using adjacency lists.
    Nodes are represented as UUIDs and edges have weights.
    """

    def __init__(self):
        """Initialize an empty graph."""
        # Adjacency list: {node_uuid: [(neighbor_uuid, weight), ...]}
        self.graph: Dict[uuid.UUID, List[Tuple[uuid.UUID, float]]] = defaultdict(list)
        # Set of all nodes (even those with no edges)
        self.nodes: Set[uuid.UUID] = set()

    def add_node(self, node_id: Optional[uuid.UUID] = None) -> uuid.UUID:
        """
        Add a node to the graph.

        Args:
            node_id: Optional UUID for the node. If None, a new UUID is generated.

        Returns:
            The UUID of the added node.
        """
        if node_id is None:
            node_id = uuid.uuid4()

        self.nodes.add(node_id)
        return node_id

    def add_edge(
        self, source: uuid.UUID, destination: uuid.UUID, weight: float
    ) -> None:
        """
        Add a weighted edge from source to destination.

        Args:
            source: UUID of the source node
            destination: UUID of the destination node
            weight: Weight of the edge
        """
        # Ensure both nodes exist in the graph
        self.nodes.add(source)
        self.nodes.add(destination)

        # Add the edge
        self.graph[source].append((destination, weight))

    def add_bidirectional_edge(
        self, node1: uuid.UUID, node2: uuid.UUID, weight: float
    ) -> None:
        """
        Add a bidirectional (undirected) edge between two nodes with the same weight.

        Args:
            node1: UUID of the first node
            node2: UUID of the second node
            weight: Weight of the edge in both directions
        """
        self.add_edge(node1, node2, weight)
        self.add_edge(node2, node1, weight)

    def remove_node(self, node_id: uuid.UUID) -> None:
        """
        Remove a node and all its edges from the graph.

        Args:
            node_id: UUID of the node to remove
        """
        if node_id not in self.nodes:
            return

        # Remove the node from the nodes set
        self.nodes.remove(node_id)

        # Remove all edges from this node
        if node_id in self.graph:
            del self.graph[node_id]

        # Remove all edges to this node
        for source in self.graph:
            self.graph[source] = [
                (dest, weight) for dest, weight in self.graph[source] if dest != node_id
            ]

    def remove_edge(self, source: uuid.UUID, destination: uuid.UUID) -> None:
        """
        Remove an edge from the graph.

        Args:
            source: UUID of the source node
            destination: UUID of the destination node
        """
        if source in self.graph:
            self.graph[source] = [
                (dest, weight)
                for dest, weight in self.graph[source]
                if dest != destination
            ]

    def get_neighbors(self, node_id: uuid.UUID) -> List[Tuple[uuid.UUID, float]]:
        """
        Get all neighbors of a node along with the edge weights.

        Args:
            node_id: UUID of the node

        Returns:
            List of tuples containing (neighbor_uuid, weight)
        """
        return self.graph.get(node_id, [])

    def get_all_edges(self) -> List[Tuple[uuid.UUID, uuid.UUID, float]]:
        """
        Get all edges in the graph.

        Returns:
            List of tuples containing (source_uuid, destination_uuid, weight)
        """
        edges = []
        for source, neighbors in self.graph.items():
            for destination, weight in neighbors:
                edges.append((source, destination, weight))
        return edges

    def get_node_count(self) -> int:
        """
        Get the number of nodes in the graph.

        Returns:
            Number of nodes
        """
        return len(self.nodes)

    def get_edge_count(self) -> int:
        """
        Get the number of edges in the graph.

        Returns:
            Number of edges
        """
        return sum(len(neighbors) for neighbors in self.graph.values())

    def __str__(self) -> str:
        """String representation of the graph."""
        result = "Graph:\n"
        for node in self.nodes:
            result += f"Node {node}:\n"
            for neighbor, weight in self.graph.get(node, []):
                result += f"  → {neighbor} (weight: {weight})\n"
        return result


async def build_graph():
    try:
        conn = await get_db_connection()

        rows = await conn.fetch(
            """
            SELECT * FROM hubs
            """
        )

        graph = WeightedGraph()
        for row in rows:
            # Convert asyncpg UUID to Python's standard UUID
            station_id = uuid.UUID(str(row["station_id"]))
            graph.add_node(station_id)

            route1_id = row["route1_id"]
            route2_id = row["route2_id"]
            connected_stations = await conn.fetch(
                """
                SELECT station_id FROM routes_stations WHERE route_id = $1 OR route_id = $2
                """,
                route1_id,
                route2_id,
            )

            logger.info(connected_stations)

            for station in connected_stations:
                # Convert asyncpg UUID to Python's standard UUID
                connected_station_id = uuid.UUID(str(station["station_id"]))
                graph.add_node(connected_station_id)
                logger.info(connected_station_id)

                price = await conn.fetch(
                    """
                    SELECT price FROM ticket_price
                    WHERE (station1_id = $1 AND station2_id = $2)
                        OR (station1_id = $2 AND station2_id = $1)
                    """,
                    str(station_id),  # Convert UUID to string for SQL
                    str(connected_station_id),  # Convert UUID to string for SQL
                )

                if price and len(price) > 0:
                    # Check if price result exists and has at least one row
                    price_value = price[0][
                        "price"
                    ]  # Access first row and 'price' column
                    graph.add_edge(station_id, connected_station_id, price_value)
                else:
                    # Handle case where no price is found - you might want to set a default or log a warning
                    logger.warning(
                        f"No price found between stations {station_id} and {connected_station_id}"
                    )
                    # Optionally add edge with default price (e.g., 0.0) or skip adding this edge
                    # graph.add_edge(station_id, connected_station_id, 0.0)

        logger.info(
            f"Graph built successfully with {graph.get_node_count()} nodes and {graph.get_edge_count()} edges"
        )
        logger.info(f"{str(graph)}")
        logger.debug(str(graph))

        # Optionally return the graph if needed elsewhere
        return graph

    except Exception as e:
        logger.error(f"Error building graph: {str(e)}")
        # Re-raise or return None depending on how you want to handle failures
        raise
