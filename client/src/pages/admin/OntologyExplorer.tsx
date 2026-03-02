/**
 * ONTOLOGY EXPLORER UI
 *
 * Browse, search, and manage Palantir Ontology objects
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Database,
  Link2,
  RefreshCw,
  ChevronRight,
  Folder,
  File,
  Eye,
  ExternalLink,
  Filter,
  X,
  Box,
  Layers,
  Grid3X3,
} from "lucide-react";

interface ObjectType {
  apiName: string;
  displayName: string;
  description?: string;
  category?: string;
}

interface ObjectProperty {
  name: string;
  type: string;
  description?: string;
  linkType?: string;
  values?: string[];
}

interface OntologyObject {
  [key: string]: any;
}

export default function OntologyExplorer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<OntologyObject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch object types
  const { data: typesData, isLoading: loadingTypes } = useQuery({
    queryKey: ["ontology-types"],
    queryFn: async () => {
      const response = await fetch("/api/ontology-explorer/types");
      if (!response.ok) throw new Error("Failed to fetch types");
      return response.json();
    },
  });

  // Fetch schema for selected type
  const { data: schemaData, isLoading: loadingSchema } = useQuery({
    queryKey: ["ontology-schema", selectedType],
    queryFn: async () => {
      if (!selectedType) return null;
      const response = await fetch(`/api/ontology-explorer/types/${selectedType}/schema`);
      if (!response.ok) throw new Error("Failed to fetch schema");
      return response.json();
    },
    enabled: !!selectedType,
  });

  // Fetch objects of selected type
  const { data: objectsData, isLoading: loadingObjects } = useQuery({
    queryKey: ["ontology-objects", selectedType, searchQuery],
    queryFn: async () => {
      if (!selectedType) return null;
      const params = new URLSearchParams({ limit: "50" });
      if (searchQuery) params.set("search", searchQuery);
      const response = await fetch(`/api/ontology-explorer/objects/${selectedType}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch objects");
      return response.json();
    },
    enabled: !!selectedType,
  });

  // Global search
  const { data: searchResults, isLoading: loadingSearch } = useQuery({
    queryKey: ["ontology-search", globalSearch],
    queryFn: async () => {
      if (!globalSearch) return null;
      const response = await fetch(`/api/ontology-explorer/search?q=${encodeURIComponent(globalSearch)}`);
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    enabled: !!globalSearch && globalSearch.length >= 2,
  });

  // Fetch links for selected object
  const { data: linksData } = useQuery({
    queryKey: ["ontology-links", selectedType, selectedObject],
    queryFn: async () => {
      if (!selectedType || !selectedObject) return null;
      const idField = selectedType.charAt(0).toLowerCase() + selectedType.slice(1) + "Id";
      const objectId = selectedObject[idField] || selectedObject.id;
      if (!objectId) return null;
      const response = await fetch(`/api/ontology-explorer/objects/${selectedType}/${objectId}/links`);
      if (!response.ok) throw new Error("Failed to fetch links");
      return response.json();
    },
    enabled: !!selectedType && !!selectedObject,
  });

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      work: "bg-blue-100 text-blue-800",
      governance: "bg-purple-100 text-purple-800",
      financial: "bg-green-100 text-green-800",
      organization: "bg-orange-100 text-orange-800",
      strategy: "bg-pink-100 text-pink-800",
      automation: "bg-cyan-100 text-cyan-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category || "other"] || colors.other;
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "work":
        return <File className="h-4 w-4" />;
      case "governance":
        return <Layers className="h-4 w-4" />;
      case "financial":
        return <Database className="h-4 w-4" />;
      case "organization":
        return <Folder className="h-4 w-4" />;
      default:
        return <Box className="h-4 w-4" />;
    }
  };

  const getDisplayValue = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const renderObjectCard = (obj: OntologyObject) => {
    const nameField = Object.keys(obj).find(
      (k) => k === "name" || k === "title" || k.endsWith("Name")
    );
    const name = nameField ? obj[nameField] : "Unnamed Object";
    const idField = Object.keys(obj).find((k) => k.endsWith("Id"));
    const id = idField ? obj[idField] : "";

    return (
      <Card
        key={id || Math.random()}
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => {
          setSelectedObject(obj);
          setDetailsOpen(true);
        }}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base truncate">{name}</CardTitle>
          {id && (
            <CardDescription className="text-xs font-mono truncate">{id}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            {obj.status && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={obj.status === "green" ? "default" : "destructive"}>
                  {obj.status}
                </Badge>
              </div>
            )}
            {obj.priority && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Priority:</span>
                <span>{obj.priority}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ontology Explorer</h1>
          <p className="text-muted-foreground">
            Browse and search Palantir Ontology objects
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["ontology-types"] });
            queryClient.invalidateQueries({ queryKey: ["ontology-objects"] });
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Global Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search across all object types..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {globalSearch && (
              <Button variant="ghost" size="icon" onClick={() => setGlobalSearch("")}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {globalSearch && globalSearch.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Results</CardTitle>
            <CardDescription>
              {loadingSearch
                ? "Searching..."
                : `Found ${searchResults?.totalCount || 0} results`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSearch ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Searching...
              </div>
            ) : searchResults?.totalCount === 0 ? (
              <p className="text-muted-foreground text-center py-4">No results found</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(searchResults?.results || {}).map(([typeName, objects]: [string, any]) => (
                  <div key={typeName}>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Badge variant="outline">{typeName}</Badge>
                      <span className="text-muted-foreground text-sm">
                        ({objects.length} results)
                      </span>
                    </h4>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {objects.slice(0, 6).map((obj: OntologyObject, i: number) => {
                        const nameField = Object.keys(obj).find(
                          (k) => k === "name" || k === "title"
                        );
                        return (
                          <Card
                            key={i}
                            className="p-3 hover:bg-muted cursor-pointer"
                            onClick={() => {
                              setSelectedType(typeName);
                              setSelectedObject(obj);
                              setDetailsOpen(true);
                              setGlobalSearch("");
                            }}
                          >
                            <p className="font-medium truncate">
                              {nameField ? obj[nameField] : "Unnamed"}
                            </p>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Object Types Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Object Types</CardTitle>
            <CardDescription>{typesData?.total || 0} types available</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {loadingTypes ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-1 p-4">
                  {Object.entries(typesData?.byCategory || {}).map(
                    ([category, types]: [string, any]) => (
                      <div key={category} className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          {getCategoryIcon(category)}
                          <span className="text-sm font-medium capitalize">{category}</span>
                        </div>
                        {types.map((type: ObjectType) => (
                          <Button
                            key={type.apiName}
                            variant={selectedType === type.apiName ? "secondary" : "ghost"}
                            className="w-full justify-start text-left h-auto py-2"
                            onClick={() => {
                              setSelectedType(type.apiName);
                              setSearchQuery("");
                            }}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <ChevronRight
                                className={`h-4 w-4 transition-transform ${
                                  selectedType === type.apiName ? "rotate-90" : ""
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="truncate">{type.displayName}</p>
                                {type.description && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {type.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Objects List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {selectedType ? `${selectedType} Objects` : "Select an Object Type"}
                </CardTitle>
                <CardDescription>
                  {objectsData?.total
                    ? `${objectsData.total} objects found`
                    : selectedType
                    ? "Loading..."
                    : "Choose a type from the sidebar"}
                </CardDescription>
              </div>
              {selectedType && (
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "table" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("table")}
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {selectedType && (
              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${selectedType}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedType ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Database className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Select an Object Type</p>
                <p className="text-muted-foreground">
                  Choose a type from the sidebar to browse objects
                </p>
              </div>
            ) : loadingObjects ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                Loading objects...
              </div>
            ) : objectsData?.objects?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Box className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No Objects Found</p>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "This type has no objects"}
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {objectsData?.objects?.map((obj: OntologyObject) => renderObjectCard(obj))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {schemaData?.schema?.properties?.slice(0, 6).map((prop: ObjectProperty) => (
                        <TableHead key={prop.name}>{prop.name}</TableHead>
                      ))}
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {objectsData?.objects?.map((obj: OntologyObject, i: number) => (
                      <TableRow key={i}>
                        {schemaData?.schema?.properties?.slice(0, 6).map((prop: ObjectProperty) => (
                          <TableCell key={prop.name} className="max-w-[200px] truncate">
                            {prop.type === "enum" && obj[prop.name] ? (
                              <Badge variant="outline">{obj[prop.name]}</Badge>
                            ) : (
                              getDisplayValue(obj[prop.name])
                            )}
                          </TableCell>
                        ))}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedObject(obj);
                              setDetailsOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Object Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Object Details</DialogTitle>
            <DialogDescription>
              {selectedType} object properties and links
            </DialogDescription>
          </DialogHeader>
          {selectedObject && (
            <div className="space-y-6">
              {/* Properties */}
              <div>
                <h4 className="font-medium mb-2">Properties</h4>
                <div className="grid gap-2">
                  {Object.entries(selectedObject).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-start gap-2 py-1 border-b border-muted"
                    >
                      <span className="text-sm font-medium text-muted-foreground w-1/3">
                        {key}
                      </span>
                      <span className="text-sm flex-1 break-all">
                        {getDisplayValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Links */}
              {linksData && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Linked Objects
                  </h4>
                  {Object.keys(linksData.outgoingLinks || {}).length === 0 &&
                  Object.keys(linksData.incomingLinks || {}).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No linked objects</p>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(linksData.outgoingLinks || {}).map(
                        ([linkType, objects]: [string, any]) => (
                          <div key={linkType}>
                            <Badge variant="outline" className="mb-2">
                              {linkType} (outgoing)
                            </Badge>
                            <div className="grid gap-2">
                              {objects.map((obj: OntologyObject, i: number) => {
                                const nameField = Object.keys(obj).find(
                                  (k) => k === "name" || k === "title"
                                );
                                return (
                                  <Card
                                    key={i}
                                    className="p-2 hover:bg-muted cursor-pointer"
                                    onClick={() => {
                                      setSelectedType(linkType);
                                      setSelectedObject(obj);
                                    }}
                                  >
                                    <p className="text-sm">
                                      {nameField ? obj[nameField] : "Unnamed"}
                                    </p>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        )
                      )}
                      {Object.entries(linksData.incomingLinks || {}).map(
                        ([linkType, objects]: [string, any]) => (
                          <div key={linkType}>
                            <Badge variant="secondary" className="mb-2">
                              {linkType} (incoming)
                            </Badge>
                            <div className="grid gap-2">
                              {objects.map((obj: OntologyObject, i: number) => {
                                const nameField = Object.keys(obj).find(
                                  (k) => k === "name" || k === "title"
                                );
                                return (
                                  <Card
                                    key={i}
                                    className="p-2 hover:bg-muted cursor-pointer"
                                    onClick={() => {
                                      setSelectedType(linkType);
                                      setSelectedObject(obj);
                                    }}
                                  >
                                    <p className="text-sm">
                                      {nameField ? obj[nameField] : "Unnamed"}
                                    </p>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
