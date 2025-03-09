import uuid
from collections import defaultdict
from typing import Dict, List, Optional, Set, Tuple


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


graph = WeightedGraph()
