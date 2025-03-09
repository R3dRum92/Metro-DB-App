import heapq
from collections import defaultdict
from typing import Dict, List, Optional, Set, Tuple

from app.routes.common_imports import *

router = APIRouter()


class RouteSegment(BaseModel):
    origin_station_name: str
    destination_station_name: str
    origin_station_id: uuid.UUID
    destination_station_id: uuid.UUID
    route_id: uuid.UUID
    route_name: str
    price: float


class JourneyResponse(BaseModel):
    origin_station_name: str
    destination_station_name: str
    total_price: float
    intermediate_stations: Optional[List[str]] = []
    segments: List[RouteSegment] = []
    requires_route_change: bool = False


# Assuming the WeightedGraph class is already defined as in the provided code


def dijkstra(
    graph: WeightedGraph, start: uuid.UUID, end: Optional[uuid.UUID] = None
) -> Tuple[Dict[uuid.UUID, float], Dict[uuid.UUID, Optional[uuid.UUID]]]:
    """
    Implementation of Dijkstra's algorithm to find shortest paths from a start node.

    Args:
        graph: The weighted graph to traverse
        start: UUID of the starting node
        end: Optional UUID of the target node. If provided, the algorithm will
             terminate early once the shortest path to this node is found.

    Returns:
        A tuple containing:
        - distances: Dictionary mapping node UUIDs to their shortest distance from start
        - predecessors: Dictionary mapping node UUIDs to their predecessor in the shortest path
    """
    if start not in graph.nodes:
        raise ValueError(f"Start node {start} not in graph")
    if end is not None and end not in graph.nodes:
        raise ValueError(f"End node {end} not in graph")

    # Initialize distances with infinity for all nodes except the start node
    distances = {node: float("infinity") for node in graph.nodes}
    distances[start] = 0

    # Dictionary to keep track of predecessors
    predecessors = {node: None for node in graph.nodes}

    # Priority queue for nodes to visit next
    # Format: (distance, node_uuid)
    priority_queue = [(0, start)]

    # Set of visited nodes
    visited = set()

    while priority_queue:
        # Get the node with the smallest distance
        current_distance, current_node = heapq.heappop(priority_queue)

        # If we've reached the target node, we can stop
        if current_node == end:
            break

        # Skip if we've already processed this node
        if current_node in visited:
            continue

        # Mark as visited
        visited.add(current_node)

        # Check all neighbors
        for neighbor, weight in graph.get_neighbors(current_node):
            # Skip visited neighbors
            if neighbor in visited:
                continue

            # Calculate distance to neighbor through current node
            distance = current_distance + weight

            # If we found a shorter path to the neighbor
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                predecessors[neighbor] = current_node

                # Add to priority queue
                heapq.heappush(priority_queue, (distance, neighbor))

    return distances, predecessors


def get_shortest_path(
    graph: WeightedGraph, start: uuid.UUID, end: uuid.UUID
) -> Tuple[List[uuid.UUID], float]:
    """
    Find the shortest path between two nodes in a weighted graph.

    Args:
        graph: The weighted graph to traverse
        start: UUID of the starting node
        end: UUID of the target node

    Returns:
        A tuple containing:
        - path: List of node UUIDs representing the shortest path from start to end
        - total_distance: Total distance (sum of weights) of the shortest path
    """
    # Run Dijkstra's algorithm
    distances, predecessors = dijkstra(graph, start, end)

    # If end is not reachable from start
    if distances[end] == float("infinity"):
        return [], float("infinity")

    # Reconstruct the path
    path = []
    current = end

    while current is not None:
        path.append(current)
        current = predecessors[current]

    # Reverse the path to get it from start to end
    path.reverse()

    return path, distances[end]


def get_all_shortest_paths(
    graph: WeightedGraph, start: uuid.UUID
) -> Dict[uuid.UUID, Tuple[List[uuid.UUID], float]]:
    """
    Find shortest paths from a start node to all other nodes in the graph.

    Args:
        graph: The weighted graph to traverse
        start: UUID of the starting node

    Returns:
        Dictionary mapping each node to a tuple containing:
        - path: List of node UUIDs representing the shortest path from start to the node
        - distance: Total distance of the shortest path
    """
    # Run Dijkstra's algorithm to get distances and predecessors
    distances, predecessors = dijkstra(graph, start)

    # Dictionary to store results
    result = {}

    # For each node in the graph
    for node in graph.nodes:
        # Skip the start node
        if node == start:
            result[node] = ([start], 0)
            continue

        # If node is not reachable
        if distances[node] == float("infinity"):
            result[node] = ([], float("infinity"))
            continue

        # Reconstruct the path
        path = []
        current = node

        while current is not None:
            path.append(current)
            current = predecessors[current]

        # Reverse the path to get it from start to end
        path.reverse()

        result[node] = (path, distances[node])

    return result


@router.get("/calculate-fare", response_model=JourneyResponse)
async def calculate_fare(origin_station_id: str, destination_station_id: str):
    try:
        origin_id = uuid.UUID(origin_station_id)
        destination_id = uuid.UUID(destination_station_id)

        conn = await get_db_connection()
        try:
            same_route = await conn.fetchrow(
                """
                SELECT price
                FROM ticket_price
                WHERE (station1_id = $1 AND station2_id = $2)
                    OR (station1_id = $2 AND station2_id = $1)
                """,
                origin_id,
                destination_id,
            )

            origin_station_row = await conn.fetchrow(
                """
                    SELECT station_name 
                    FROM stations
                    WHERE station_id = $1
                    """,
                origin_id,
            )
            origin_station_name = origin_station_row["station_name"]
            destination_station_row = await conn.fetchrow(
                """
                    SELECT station_name 
                    FROM stations
                    WHERE station_id = $1
                    """,
                destination_id,
            )
            destination_station_name = destination_station_row["station_name"]

            if same_route:
                logger.info("paisi")

                route = await conn.fetchrow(
                    """
                    SELECT t.route_id, t.route_name
                    FROM routes_stations r
                        JOIN routes_stations s ON r.route_id = s.route_id
                        JOIN routes t ON r.route_id = t.route_id
                    WHERE r.station_id = $1
                        AND s.station_id = $2
                    """,
                    origin_id,
                    destination_id,
                )
                logger.info(origin_id)
                logger.info(destination_id)
                route_id = route["route_id"]
                route_name = route["route_name"]
                journey = JourneyResponse(
                    origin_station_name=origin_station_name,
                    destination_station_name=destination_station_name,
                    total_price=same_route["price"],
                )
                segment = RouteSegment(
                    origin_station_name=origin_station_name,
                    destination_station_name=destination_station_name,
                    origin_station_id=origin_id,
                    destination_station_id=destination_id,
                    route_id=route_id,
                    route_name=route_name,
                    price=same_route["price"],
                )
                journey.segments.append(segment)
                journey.requires_route_change = False
                return journey
            else:
                logger.info("graph")
                best_path, best_price = get_shortest_path(
                    graph=graph, start=origin_id, end=destination_id
                )
                journey = JourneyResponse(
                    origin_station_name=origin_station_name,
                    destination_station_name=destination_station_name,
                    total_price=best_price,
                    requires_route_change=True,
                )

                for i in range(1, len(best_path)):
                    start_id = best_path[i - 1]
                    end_id = best_path[i]

                    price = await conn.fetchrow(
                        """
                        SELECT price
                        FROM ticket_price
                        WHERE (station1_id = $1 AND station2_id = $2)
                            OR (station1_id = $2 AND station2_id = $1)
                        """,
                        start_id,
                        end_id,
                    )

                    start = await conn.fetchrow(
                        """
                        SELECT station_name
                        FROM stations
                        WHERE station_id = $1
                        """,
                        start_id,
                    )
                    start_name = start["station_name"]
                    end = await conn.fetchrow(
                        """
                        SELECT station_name
                        FROM stations
                        WHERE station_id = $1
                        """,
                        end_id,
                    )
                    end_name = end["station_name"]
                    route = await conn.fetchrow(
                        """
                    SELECT t.route_id, t.route_name
                    FROM routes_stations r
                        JOIN routes_stations s ON r.route_id = s.route_id
                        JOIN routes t ON r.route_id = t.route_id
                    WHERE r.station_id = $1
                        AND s.station_id = $2
                    """,
                        start_id,
                        end_id,
                    )
                    route_id = route["route_id"]
                    route_name = route["route_name"]
                    segment = RouteSegment(
                        origin_station_name=start_name,
                        destination_station_name=end_name,
                        origin_station_id=start_id,
                        destination_station_id=end_id,
                        route_id=route_id,
                        route_name=route_name,
                        price=price["price"],
                    )
                    journey.segments.append(segment)
                    if i != len(best_path) - 1:
                        journey.intermediate_stations.append(end_name)

                return journey

        except Exception as e:
            logger.error(f"Error calculating fare: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error calculating fare. Please try again later.",
            )
    except Exception as e:
        logger.error(f"Error calculating fare: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error calculating fare. Please try again later.",
        )
