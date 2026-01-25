import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";
import { PRELIMS_PATTERN, MAINS_PATTERN, MAINS_TOTAL } from "./OPSCExamData";

export const OPSCExamPattern: React.FC = () => {
  const [prelimsOpen, setPrelimsOpen] = useState(true);
  const [mainsOpen, setMainsOpen] = useState(true);

  return (
    <div className="space-y-6">
      {/* Prelims Pattern */}
      <Collapsible open={prelimsOpen} onOpenChange={setPrelimsOpen}>
        <Card className="border-border/50 overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Preliminary Examination</CardTitle>
                    <p className="text-sm text-muted-foreground">Objective Type • 400 Marks Total</p>
                  </div>
                </div>
                {prelimsOpen ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Paper</TableHead>
                      <TableHead className="text-center">Marks</TableHead>
                      <TableHead className="text-center">Questions</TableHead>
                      <TableHead className="text-center">Duration</TableHead>
                      <TableHead className="text-center">Negative Marking</TableHead>
                      <TableHead className="text-center">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PRELIMS_PATTERN.map((paper) => (
                      <TableRow key={paper.code} className="hover:bg-muted/20">
                        <TableCell className="font-medium">{paper.paper}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{paper.marks}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{paper.questions}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {paper.duration} min
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {paper.negativeMarking ? (
                            <div className="flex items-center justify-center gap-1 text-amber-600">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="text-xs">{paper.negativeValue} per wrong</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {paper.isQualifying ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-600/50">
                              Qualifying ({paper.qualifyingPercent}%)
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-green-600 border-green-600/50">
                              Merit Ranking
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-700">Important Note</p>
                    <p className="text-muted-foreground mt-1">
                      CSAT (Paper II) is qualifying in nature. Candidates must score at least 33% marks to be eligible for evaluation of Paper I. 
                      Only Paper I marks are considered for merit ranking and shortlisting for Mains.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Mains Pattern */}
      <Collapsible open={mainsOpen} onOpenChange={setMainsOpen}>
        <Card className="border-border/50 overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <FileText className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Main Examination</CardTitle>
                    <p className="text-sm text-muted-foreground">Descriptive Type • 2250 Marks (1750 Merit + 500 Qualifying)</p>
                  </div>
                </div>
                {mainsOpen ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead>Paper</TableHead>
                      <TableHead className="text-center">Marks</TableHead>
                      <TableHead className="text-center">Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MAINS_PATTERN.map((paper, idx) => (
                      <TableRow key={idx} className={`hover:bg-muted/20 ${paper.isQualifying ? "bg-muted/10" : ""}`}>
                        <TableCell className="font-medium">{paper.paper}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{paper.marks}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {paper.isQualifying ? (
                            <Badge variant="outline" className="text-amber-600 border-amber-600/50">
                              Qualifying
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500/10 text-green-600 border-green-600/50">
                              Merit
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Marks Summary */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 text-center">
                  <p className="text-3xl font-bold text-blue-600">{MAINS_TOTAL.meritTotal}</p>
                  <p className="text-sm text-muted-foreground mt-1">Mains Merit Total</p>
                  <p className="text-xs text-muted-foreground">(7 papers × 250)</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 text-center">
                  <p className="text-3xl font-bold text-purple-600">{MAINS_TOTAL.interviewMarks}</p>
                  <p className="text-sm text-muted-foreground mt-1">Interview / PT</p>
                  <p className="text-xs text-muted-foreground">Personality Test</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 text-center">
                  <p className="text-3xl font-bold text-green-600">{MAINS_TOTAL.finalTotal}</p>
                  <p className="text-sm text-muted-foreground mt-1">Final Total</p>
                  <p className="text-xs text-muted-foreground">For Final Merit</p>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-green-700">Selection Process</p>
                    <p className="text-muted-foreground mt-1">
                      Final selection is based on total marks obtained in Mains (1750) + Interview (250) = 2000 marks. 
                      Candidates must qualify in both Odia and English Language papers.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Interview Info */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <FileText className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Interview / Personality Test</CardTitle>
              <p className="text-sm text-muted-foreground">250 Marks • Final Stage</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The Interview/Personality Test assesses the candidate's suitability for administrative positions based on:
            </p>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                "Mental alertness & clarity of expression",
                "Assimilation of diverse information",
                "Balance of judgment & social cohesion",
                "Intellectual & moral integrity",
                "Leadership qualities",
                "General awareness & current affairs",
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
